import ast
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import tempfile
import unittest

try:
    import yaml
except ImportError:
    yaml = None


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = Path(".kilo/skills/blender-project-scaffold/templates/project")
POWERSHELL = shutil.which("pwsh.exe") or shutil.which("powershell.exe")


@unittest.skipUnless(os.name == "nt" and POWERSHELL, "Windows PowerShell required")
class ToolTests(unittest.TestCase):
    def setUp(self):
        temp_root = Path(tempfile.gettempdir()) / "kilo"
        if not temp_root.is_dir():
            self.skipTest(f"Approved temporary directory missing: {temp_root}")
        self.temporary = tempfile.TemporaryDirectory(prefix="blender-tools-", dir=temp_root)
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve() / "Workspace with spaces"
        (self.root / "Blender").mkdir(parents=True)
        (self.root / "tools").mkdir()
        (self.root / TEMPLATE).parent.mkdir(parents=True)
        shutil.copytree(ROOT / TEMPLATE, self.root / TEMPLATE)
        for source in (ROOT / "tools").iterdir():
            if source.suffix in {".ps1", ".cmd", ".py"}:
                shutil.copy2(source, self.root / "tools" / source.name)
        self.config = self.root / ".kilo/kilo.jsonc"
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            self.port = probe.getsockname()[1]
        self.write_config(self.port)
        self.project = self.root / "Blender/Test Project"
        self.project.mkdir()
        self.write_records()
        self.fake_exe = self.root / "not-blender.exe"
        self.fake_exe.write_bytes(b"Never execute this fixture")
        self.lock = self.root / ".kilo/blender.lock.json"

    def write_config(self, port):
        self.config.write_text(json.dumps({"mcp": {"blender": {
            "type": "local", "command": ["uvx", "mcp-for-blender"],
            "environment": {"BLENDER_PORT": str(port)},
        }}}), encoding="utf-8")

    def write_records(self, requirements=None, workflow=None):
        documents = self.project / "Documents"
        documents.mkdir(exist_ok=True)
        (documents / "REQUIREMENTS.md").write_text(requirements or (
            "Status: Confirmed\nConfirmed: 2026-10-30\n"
            "Confirmation: Confirm requirements; fixture brief revision 1.\n"
        ), encoding="utf-8")
        (documents / "WORKFLOW.md").write_text(workflow or (
            "Mode: Fully Autonomous\nSelected: 2026-10-30\n"
        ), encoding="utf-8")

    def run_script(self, name, *arguments, expected=0):
        completed = subprocess.run(
            [POWERSHELL, "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
             str(self.root / "tools" / name), *map(str, arguments)],
            cwd=self.root, capture_output=True, text=True, timeout=30,
        )
        if expected == 0:
            self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
        else:
            self.assertNotEqual(completed.returncode, 0, completed.stdout + completed.stderr)
        return completed.stdout + completed.stderr

    def launch(self, *arguments, expected=0, project=None):
        return self.run_script(
            "start-blender.ps1", "-Project", project or self.project,
            "-BlenderExe", self.fake_exe, "-DryRun", *arguments, expected=expected,
        )

    def snapshot(self):
        return {str(path.relative_to(self.root)): hashlib.sha256(path.read_bytes()).hexdigest()
                for path in self.root.rglob("*") if path.is_file()}

    def test_valid_dry_run_is_read_only(self):
        self.lock.write_text('{"pid": 2147483647}', encoding="utf-8")
        before = self.snapshot()
        output = self.launch()
        self.assertIn(f"Port: {self.port}", output)
        self.assertIn("(startup scene)", output)
        self.assertEqual(before, self.snapshot())
        self.assertFalse((self.project / "logs").exists())

    def test_draft_missing_or_placeholder_records_rejected(self):
        for content in ("Status: Draft\n", "Status: Confirmed\n",
                        "Status: Confirmed\nConfirmed: 2026-10-30\nConfirmation: -\n"):
            with self.subTest(content=content):
                self.write_records(requirements=content)
                self.assertIn("Requirements are not confirmed", self.launch(expected=1))
        (self.project / "Documents/REQUIREMENTS.md").unlink()
        self.assertIn("records are missing", self.launch(expected=1))

    def test_invalid_calendar_date_rejected(self):
        self.write_records(requirements=(
            "Status: Confirmed\nConfirmed: 2026-02-30\nConfirmation: Confirm fixture scope.\n"
        ))
        self.assertIn("Requirements are not confirmed", self.launch(expected=1))

    def test_duplicate_confirmation_fields_rejected(self):
        self.write_records(requirements=(
            "Status: Draft\nStatus: Confirmed\nConfirmed: 2026-10-30\n"
            "Confirmation: Confirm fixture scope.\n"
        ))
        self.assertIn("Requirements are not confirmed", self.launch(expected=1))

    def test_unselected_or_undated_workflow_rejected(self):
        for content in ("Mode: Unset\nSelected: 2026-10-30\n",
                        "Mode: Fully Autonomous\nSelected: -\n",
                        "Mode: Partially Autonomous\nSelected: 2026-13-01\n"):
            with self.subTest(content=content):
                self.write_records(workflow=content)
                self.assertIn("Workflow is not selected", self.launch(expected=1))

    def test_partial_mode_is_valid(self):
        self.write_records(workflow="Mode: Partially Autonomous\nSelected: 2026-10-30\n")
        self.launch()

    def test_port_override_cannot_diverge(self):
        self.assertIn("differs from workspace BLENDER_PORT", self.launch("-Port", 1024, expected=1))
        self.launch("-Port", self.port)

    def test_invalid_ports_rejected(self):
        for port in ("abc", 80, 65536):
            with self.subTest(port=port):
                self.write_config(port)
                self.assertIn("Invalid BLENDER_PORT", self.launch(expected=1))

    def test_jsonc_preserves_urls_comment_like_strings_and_trailing_commas(self):
        self.config.write_text('''{
            // Other port values must not win.
            "mcp": {
                "other": {"environment": {"BLENDER_PORT": "1234"}},
                "blender": {
                    "command": ["https://example.invalid/a/*not-comment*/",],
                    "environment": {"BLENDER_PORT": "%d",},
                }, /* trailing comment */
            },
        }''' % self.port, encoding="utf-8")
        self.assertIn(f"Port: {self.port}", self.launch())

    def test_busy_port_rejected(self):
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", self.port))
            listener.listen()
            self.assertIn("already in use", self.launch(expected=1))

    def test_outside_and_nested_projects_rejected(self):
        outside = self.root / "Other"
        outside.mkdir()
        nested = self.project / "Nested"
        nested.mkdir()
        for project in (outside, nested):
            with self.subTest(project=project):
                self.assertIn("must live under", self.launch(project=project, expected=1))

    def test_blend_file_cannot_escape_project(self):
        (self.root / "Blender/outside.blend").touch()
        for path in (self.root / "Blender/outside.blend", "../outside.blend"):
            with self.subTest(path=path):
                self.assertIn("must stay inside", self.launch("-BlendFile", path, expected=1))

    def test_relative_and_positional_blend_paths(self):
        scene = self.project / "main scene.blend"
        scene.touch()
        self.assertIn(str(scene), self.launch("-BlendFile", scene.name))
        self.assertIn(str(scene), self.launch(project=scene))

    def test_multiple_blends_require_explicit_selection(self):
        (self.project / "one.blend").touch()
        (self.project / "two.blend").touch()
        self.assertIn("Multiple .blend files", self.launch(expected=1))
        self.launch("-BlendFile", "one.blend")

    def test_non_blend_file_rejected(self):
        self.assertIn("Not a .blend file", self.launch(
            "-BlendFile", "Documents/REQUIREMENTS.md", expected=1
        ))

    def test_junction_project_rejected(self):
        junction = self.root / "Blender/Linked"
        command = "New-Item -ItemType Junction -Path '{}' -Target '{}' | Out-Null".format(
            str(junction).replace("'", "''"), str(self.project).replace("'", "''")
        )
        result = subprocess.run([POWERSHELL, "-NoProfile", "-Command", command],
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.addCleanup(lambda: junction.rmdir() if junction.exists() else None)
        self.assertIn("symbolic links or junctions", self.launch(project=junction, expected=1))

    def test_logs_cannot_be_file_or_junction(self):
        logs = self.project / "logs"
        logs.touch()
        self.assertIn("logs path must be a directory", self.launch(expected=1))
        logs.unlink()
        target = self.root / "Outside logs"
        target.mkdir()
        command = "New-Item -ItemType Junction -Path '{}' -Target '{}' | Out-Null".format(
            str(logs).replace("'", "''"), str(target).replace("'", "''")
        )
        result = subprocess.run([POWERSHELL, "-NoProfile", "-Command", command],
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.addCleanup(lambda: logs.rmdir() if logs.exists() else None)
        self.assertIn("symbolic links or junctions", self.launch(expected=1))
        self.assertEqual(list(target.iterdir()), [])

    def test_active_lock_rejects_project_scene_and_port_changes(self):
        lock = {"pid": os.getpid(), "processName": "python", "project": str(self.project),
                "blend": "", "port": self.port}
        self.lock.write_text(json.dumps(lock), encoding="utf-8")
        before = self.snapshot()
        self.assertIn("Already running", self.launch())
        self.assertEqual(before, self.snapshot())
        for field, value, message in (
            ("project", str(self.root / "Blender/Other"), "Only one Blender instance"),
            ("blend", str(self.project / "other.blend"), "different scene or port"),
            ("port", self.port + 1, "different scene or port"),
        ):
            with self.subTest(field=field):
                self.lock.write_text(json.dumps({**lock, field: value}), encoding="utf-8")
                self.assertIn(message, self.launch(expected=1))

    def test_lock_start_time_prevents_pid_reuse_false_positive(self):
        self.lock.write_text(json.dumps({
            "pid": os.getpid(), "processName": "python", "project": str(self.project),
            "blend": "", "port": self.port, "processStartedAt": "1900-01-01T00:00:00.0000000Z",
        }), encoding="utf-8")
        before = self.snapshot()
        self.assertIn("(startup scene)", self.launch())
        self.assertEqual(before, self.snapshot())

    def test_concurrent_launch_rejected_by_workspace_mutex(self):
        import ctypes
        from ctypes import wintypes

        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.CreateMutexW.argtypes = (ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR)
        kernel.CreateMutexW.restype = wintypes.HANDLE
        kernel.ReleaseMutex.argtypes = (wintypes.HANDLE,)
        kernel.CloseHandle.argtypes = (wintypes.HANDLE,)
        key = hashlib.sha256(str(self.root).lower().encode("utf-8")).hexdigest().upper()
        handle = kernel.CreateMutexW(None, True, f"Local\\KiloBlender-{key}")
        self.assertTrue(handle, ctypes.get_last_error())
        try:
            before = self.snapshot()
            self.assertIn("launch from this workspace is in progress", self.launch(expected=1))
            self.assertEqual(before, self.snapshot())
        finally:
            kernel.ReleaseMutex(handle)
            kernel.CloseHandle(handle)

    def test_scaffold_start_fails_before_writes(self):
        output = self.run_script("new-blender-project.ps1", "-Name", "New Project", "-Start", expected=1)
        self.assertIn("-Start is not supported", output)
        self.assertFalse((self.root / "Blender/New Project").exists())

    def test_invalid_project_names_rejected(self):
        for name in ("CON", "nul", "COM1", "LPT9", "Trailing ", "../escape"):
            with self.subTest(name=name):
                self.assertIn("Invalid project name", self.run_script(
                    "new-blender-project.ps1", "-Name", name, expected=1
                ))

    def test_scaffold_copies_hidden_files_and_replaces_tokens_once(self):
        self.run_script("new-blender-project.ps1", "-Name", "New Project",
                        "-Description", "Keep {{DATE}} as literal user text")
        project = self.root / "Blender/New Project"
        self.assertTrue((project / ".gitignore").is_file())
        self.assertTrue((project / "assets/models/.gitkeep").is_file())
        readme = (project / "README.md").read_text(encoding="utf-8")
        self.assertIn("Keep {{DATE}} as literal user text", readme)
        self.assertIn("new-project.blend", readme)
        self.assertNotIn("{{PROJECT_NAME}}", readme)
        brief = project / "Documents/Goals/01-project-brief.md"
        self.assertIn("`../../../../AGENTS.md`", brief.read_text(encoding="utf-8"))
        self.assertEqual((brief.parent / "../../../../AGENTS.md").resolve(),
                         self.root / "AGENTS.md")
        self.assertIn("Requirements are not confirmed", self.launch(project=project, expected=1))

    def test_scaffold_dry_run_does_not_write(self):
        before = self.snapshot()
        self.run_script("new-blender-project.ps1", "-Name", "Preview", "-DryRun")
        self.assertEqual(before, self.snapshot())

    def test_batch_wrappers_preserve_failures_and_reject_fallback(self):
        for name, args, message in (
            ("start-blender.cmd", ["--batch"], "Pure batch launch is unsupported"),
            ("start-blender.cmd", ["missing-project", "-DryRun"], "Project path not found"),
            ("new-blender-project.cmd", ["-Name", "CON"], "Invalid project name"),
        ):
            with self.subTest(name=name, args=args):
                completed = subprocess.run(["cmd.exe", "/d", "/c",
                                            str(self.root / "tools" / name), *args],
                                           cwd=self.root, capture_output=True, text=True, timeout=30)
                self.assertNotEqual(completed.returncode, 0)
                self.assertIn(message, completed.stdout + completed.stderr)

    def test_log_host_preserves_arguments_logs_and_native_exit_codes(self):
        native = self.root / "native fixture.cmd"
        scene = self.project / "main scene.blend"
        bootstrap = self.root / "tools/start_blender_mcp.py"
        log = self.project / "logs/native fixture.log"
        for exit_code in (0, 7):
            with self.subTest(exit_code=exit_code):
                native.write_text(
                    "@echo off\nsetlocal DisableDelayedExpansion\n"
                    "echo Scene argument: %~1\necho Log option: %~2\n"
                    "echo Log selector: %~3\necho Python option: %~4\n"
                    "echo Bootstrap argument: %~5\necho Native stderr fixture 1>&2\n"
                    f"exit /b {exit_code}\n", encoding="utf-8",
                )
                result = subprocess.run([
                    POWERSHELL, "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
                    str(self.root / "tools/start-blender-log.ps1"), "-BlenderExe", str(native),
                    "-ProjectRoot", str(self.project), "-LogPath", str(log),
                    "-Bootstrap", str(bootstrap), "-BlendPath", str(scene),
                ], cwd=self.root, capture_output=True, text=True, timeout=30)
                self.assertEqual(result.returncode, exit_code, result.stdout + result.stderr)
                contents = log.read_bytes()
                text = contents.decode("utf-16" if contents.startswith(b"\xff\xfe") else "utf-8-sig")
                for expected in (f"Scene argument: {scene}", "Log option: --log", "Log selector: *",
                                 "Python option: --python", f"Bootstrap argument: {bootstrap}",
                                 "Native stderr fixture", f"Blender exited with code {exit_code}."):
                    self.assertIn(expected, text)

    def test_log_host_missing_executable_returns_failure(self):
        output = self.run_script(
            "start-blender-log.ps1", "-BlenderExe", self.root / "missing-native.exe",
            "-ProjectRoot", self.project, "-LogPath", self.project / "logs/missing.log",
            "-Bootstrap", self.root / "tools/start_blender_mcp.py", expected=1,
        )
        self.assertIn("Blender log host failed", output)


class IgnoreTests(unittest.TestCase):
    def test_nested_asset_metadata_not_binaries_is_trackable(self):
        for ignore in (ROOT / ".gitignore", ROOT / TEMPLATE / ".gitignore"):
            with self.subTest(ignore=ignore), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copy2(ignore, root / ".gitignore")
                subprocess.run(["git", "init", "-q", str(root)], check=True, capture_output=True)
                for name, ignored in (
                    ("assets/external/vendor/asset/SOURCE.md", False),
                    ("assets/external/vendor/asset/LICENSE.txt", False),
                    ("assets/external/vendor/asset/README.md", False),
                    ("assets/external/vendor/asset/model.glb", True),
                    ("scene.blend12", True),
                    (".env", True), (".env.local", True), (".env.example", False),
                    ("renders/wip/frame.png", True), ("renders/final/frame.png", False),
                ):
                    result = subprocess.run(["git", "-C", str(root), "check-ignore", "-q", "--", name],
                                            capture_output=True)
                    self.assertEqual(result.returncode, int(not ignored), name)

    def test_review_evidence_ignored_reports_tracked(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reviews = root / "Documents/Reviews"
            reviews.mkdir(parents=True)
            shutil.copy2(ROOT / TEMPLATE / ".gitignore", root / ".gitignore")
            shutil.copy2(ROOT / TEMPLATE / "Documents/Reviews/.gitignore", reviews / ".gitignore")
            subprocess.run(["git", "init", "-q", str(root)], check=True, capture_output=True)
            for name, ignored in (
                ("Documents/Reviews/R01-20261031T081500Z/_evidence/camera.png", True),
                ("Documents/Reviews/R01-20261031T081500Z/_evidence/scene.txt", True),
                ("Documents/Reviews/R01-20261031T081500Z/visual/tmp/notes.md", True),
                ("Documents/Reviews/R01-20261031T081500Z/manifest.json", False),
                ("Documents/Reviews/R01-20261031T081500Z/REVIEW.md", False),
                ("Documents/Reviews/R01-20261031T081500Z/visual/REPORT.md", False),
            ):
                result = subprocess.run(["git", "-C", str(root), "check-ignore", "-q", "--", name],
                                        capture_output=True)
                self.assertEqual(result.returncode, int(not ignored), name)


class WorkspaceContractTests(unittest.TestCase):
    def test_python_tools_parse_without_creating_bytecode(self):
        for path in (ROOT / "tools").glob("*.py"):
            with self.subTest(path=path.name):
                ast.parse(path.read_text(encoding="utf-8-sig"), filename=str(path))

    def test_template_tokens_and_internal_links(self):
        allowed = {"PROJECT_NAME", "PROJECT_SLUG", "DATE", "DESCRIPTION", "GOAL", "GOAL_TITLE"}
        for path in (ROOT / TEMPLATE).rglob("*.md"):
            text = path.read_text(encoding="utf-8")
            with self.subTest(path=str(path.relative_to(ROOT / TEMPLATE))):
                self.assertLessEqual(set(re.findall(r"\{\{([A-Z_]+)\}\}", text)), allowed)
                for target in re.findall(r"\]\(([^)]+)\)", text):
                    if "://" not in target and not target.startswith("#"):
                        self.assertTrue((path.parent / target.split("#", 1)[0]).exists(), target)

    @unittest.skipUnless(yaml, "PyYAML required for frontmatter validation")
    def test_skill_frontmatter_matches_discovery_contract(self):
        skills = list((ROOT / ".kilo/skills").glob("*/SKILL.md"))
        self.assertTrue(skills)
        for path in skills:
            with self.subTest(skill=path.parent.name):
                text = path.read_text(encoding="utf-8")
                self.assertTrue(text.startswith("---\n"))
                metadata = yaml.safe_load(text.split("---", 2)[1])
                self.assertEqual(metadata["name"], path.parent.name)
                self.assertRegex(metadata["name"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
                self.assertLessEqual(len(metadata["name"]), 64)
                self.assertIsInstance(metadata["description"], str)
                self.assertTrue(metadata["description"].strip())
                self.assertLessEqual(len(metadata["description"]), 1024)

    @unittest.skipUnless(yaml, "PyYAML required for worker validation")
    def test_worker_budgets_and_protected_paths(self):
        worker = ROOT / ".kilo/agent/blender-worker.md"
        metadata = yaml.safe_load(worker.read_text(encoding="utf-8").split("---", 2)[1])
        self.assertEqual(metadata["mode"], "subagent")
        self.assertIs(metadata["hidden"], True)
        self.assertIs(type(metadata["steps"]), int)
        self.assertGreater(metadata["steps"], 0)
        permissions = metadata["permission"]
        for tool in ("task", "agent_manager", "goal", "goal_report", "question", "bash",
                     "external_directory", "blender_generate_3d", "mediamcp_*", "generate_image"):
            self.assertEqual(permissions[tool], "deny", tool)
        edit_rules = list(permissions["edit"].items())
        self.assertEqual(edit_rules[:2], [("*", "deny"), ("Blender/**", "allow")])
        for pattern in ("Blender/**/Documents/**", "Blender/**/README.md", "Blender/**/AGENTS.md",
                        "Blender/**/.kilo/**", "Blender/**/.gitignore"):
            self.assertIn((pattern, "deny"), edit_rules[2:])
        for path in (ROOT / "config.example.json", ROOT / "config.json"):
            if not path.exists():
                continue
            with self.subTest(config=path.name):
                config = json.loads(path.read_text(encoding="utf-8-sig"))["blender_subagents"]
                self.assertEqual(config["agent"], "blender-worker")
                for field in ("provider", "model", "variant"):
                    self.assertIsInstance(config[field], str)
                    self.assertTrue(config[field].strip(), field)
                for field in ("max_minutes", "max_steps", "max_failed_attempts", "max_parallel"):
                    self.assertIs(type(config[field]), int, field)
                    self.assertGreater(config[field], 0, field)
                self.assertLessEqual(config["max_steps"], metadata["steps"])
                self.assertIn(config["max_failed_attempts"], (1, 2))
                self.assertEqual(config["max_parallel"], 1)

    @unittest.skipUnless(yaml, "PyYAML required for grader validation")
    def test_grader_agent_is_read_only_and_bounded(self):
        agent = yaml.safe_load(
            (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8").split("---", 2)[1]
        )
        self.assertEqual(agent["mode"], "subagent")
        self.assertIs(agent["hidden"], True)
        self.assertIs(type(agent["steps"]), int)
        self.assertGreater(agent["steps"], 0)
        permissions = agent["permission"]
        for tool in ("task", "agent_manager", "goal", "goal_report", "question", "bash",
                     "external_directory", "blender_execute_blender_code", "blender_import_asset",
                     "blender_generate_3d", "mediamcp_*", "generate_image"):
            self.assertEqual(permissions[tool], "deny", tool)
        edit_rules = list(permissions["edit"].items())
        self.assertEqual(edit_rules[0], ("*", "deny"))
        allow_index = edit_rules.index(("Blender/**/Documents/Reviews/**", "allow"))
        self.assertGreater(allow_index, edit_rules.index(("*", "deny")))
        for pattern in ("Blender/**/Documents/Reviews/**/_evidence/**",
                        "Blender/**/Documents/Reviews/**/tmp/**"):
            self.assertIn((pattern, "deny"), edit_rules)
            self.assertGreater(edit_rules.index((pattern, "deny")), allow_index)
        body = (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8")
        for expected in ("REPORT.md", "PASS", "CHANGES_REQUIRED", "BLOCKED"):
            self.assertIn(expected, body)

    @unittest.skipUnless(yaml, "PyYAML required for grader validation")
    def test_grader_config_example_is_valid(self):
        agent = yaml.safe_load(
            (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8").split("---", 2)[1]
        )
        graders = json.loads(
            (ROOT / "config.example.json").read_text(encoding="utf-8-sig")
        )["blender_graders"]
        self.assertEqual(graders["agent"], "blender-grader")
        self.assertIs(type(graders["enabled"]), bool)
        roster = graders["graders"]
        self.assertTrue(1 <= len(roster) <= 7)
        self.assertIs(type(graders["max_parallel"]), int)
        self.assertTrue(1 <= graders["max_parallel"] <= len(roster))
        self.assertIs(type(graders["max_rounds"]), int)
        self.assertTrue(1 <= graders["max_rounds"] <= 3)
        names = [item["name"] for item in roster]
        self.assertEqual(len(names), len(set(names)))
        for item in roster:
            with self.subTest(grader=item["name"]):
                self.assertRegex(item["name"], r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
                self.assertTrue(item["focus"].strip())
                for field in ("provider", "model", "variant"):
                    self.assertIsInstance(item[field], str)
                    self.assertTrue(item[field].strip(), field)
                for field in ("max_minutes", "max_steps"):
                    self.assertIs(type(item[field]), int, field)
                    self.assertGreater(item[field], 0, field)
                self.assertLessEqual(item["max_steps"], agent["steps"])

    def test_review_mode_and_round_templates(self):
        review = (ROOT / TEMPLATE / "Documents/REVIEW.md").read_text(encoding="utf-8")
        for expected in ("Mode: Unset", "Single grader:", "`Off`", "`All`", "`Single`"):
            self.assertIn(expected, review)
        rounds = (ROOT / TEMPLATE / "Documents/Reviews/README.md").read_text(encoding="utf-8")
        for expected in ("manifest.json", "REVIEW.md", "REPORT.md", "_evidence/"):
            self.assertIn(expected, rounds)
        ignore = (ROOT / TEMPLATE / "Documents/Reviews/.gitignore").read_text(encoding="utf-8")
        self.assertIn("**/_evidence/", ignore)
        self.assertIn("**/tmp/", ignore)
        brief = (ROOT / TEMPLATE / "Documents/Goals/01-project-brief.md").read_text(encoding="utf-8")
        self.assertIn("`../REVIEW.md`", brief)
        self.assertIn("review mode is `Unset`", brief)
        scaffold = (ROOT / ".kilo/skills/blender-project-scaffold/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("Documents/REVIEW.md", scaffold)
        self.assertIn("Reviews/", scaffold)

    def test_atomic_commit_policy_is_mandatory(self):
        policy_files = [ROOT / "AGENTS.md", ROOT / "README.md",
                        *sorted((ROOT / ".kilo/skills").rglob("SKILL.md"))]
        forbidden = re.compile(
            r"commit only (?:when|if|after)|explicit user authorization|authorizes commits",
            re.IGNORECASE,
        )
        for path in policy_files:
            with self.subTest(path=str(path.relative_to(ROOT))):
                self.assertNotRegex(path.read_text(encoding="utf-8"), forbidden)
        self.assertIn("commit atomically", (ROOT / "AGENTS.md").read_text(encoding="utf-8").lower())

    def test_questions_precede_goals_and_partial_mode_pauses(self):
        goal = (ROOT / ".kilo/skills/blender-project-goal/SKILL.md").read_text(encoding="utf-8")
        workflow = (ROOT / ".kilo/skills/blender-project-workflow/SKILL.md").read_text(encoding="utf-8")
        brief = (ROOT / TEMPLATE / "Documents/Goals/01-project-brief.md").read_text(encoding="utf-8")
        for text in (goal, workflow, brief):
            self.assertIn("/goal pause", text)
        self.assertIn("`question` is unavailable", workflow)
        self.assertIn("ordinary chat", goal)
        self.assertIn("entire filled prompt", goal)
        self.assertIn("this entire filled prompt", brief)

    def test_reference_guides_are_attributed(self):
        references = ROOT / ".kilo/skills/blender-mcp/references"
        index = (references / "README.md").read_text(encoding="utf-8")
        guides = sorted(path.name for path in references.glob("*.md") if path.name != "README.md")
        self.assertTrue(guides)
        for guide in guides:
            with self.subTest(guide=guide):
                self.assertIn(f"`{guide}`", index)
        notices = (ROOT / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")
        self.assertIn("Copyright (c) 2025 Siddharth Ahuja", notices)
        self.assertIn("MIT License", notices)
        for guide in guides:
            self.assertIn(guide, notices)
        self.assertIn("Copyright (c) 2026 Punal Manalan",
                      (ROOT / "LICENSE").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
