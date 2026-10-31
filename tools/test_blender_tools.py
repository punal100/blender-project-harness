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
POWERSHELLS = [path for path in (shutil.which("pwsh.exe"), shutil.which("powershell.exe")) if path]


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

    def write_records(self, requirements=None, workflow=None, review=None):
        documents = self.project / "Documents"
        documents.mkdir(exist_ok=True)
        (documents / "REQUIREMENTS.md").write_text(requirements or (
            "Status: Confirmed\nConfirmed: 2026-10-30\n"
            "Confirmation: Confirm requirements; fixture brief revision 1.\n"
        ), encoding="utf-8")
        (documents / "WORKFLOW.md").write_text(workflow or (
            "Mode: Fully Autonomous\nSelected: 2026-10-30\n"
        ), encoding="utf-8")
        (documents / "REVIEW.md").write_text(review or (
            "Mode: Off\nSelected: 2026-10-30\nSingle grader: -\n"
        ), encoding="utf-8")

    def run_script(self, name, *arguments, expected=0):
        return self.run_script_with(POWERSHELL, name, *arguments, expected=expected)

    def run_script_with(self, shell, name, *arguments, expected=0):
        completed = subprocess.run(
            [shell, "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
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

    def test_missing_or_invalid_review_record_rejected(self):
        (self.project / "Documents/REVIEW.md").unlink()
        self.assertIn("review records are missing", self.launch(expected=1))
        for review in (
            "Mode: Unset\nSelected: 2026-10-30\nSingle grader: -\n",
            "Mode: Off\nSelected: -\nSingle grader: -\n",
            "Mode: Invalid\nSelected: 2026-10-30\nSingle grader: -\n",
            "Mode: Off\nSelected: 2026-02-30\n",
            "Mode: Off\nMode: All\nSelected: 2026-10-30\n",
        ):
            with self.subTest(review=review):
                self.write_records(review=review)
                self.assertIn("Review mode is not selected", self.launch(expected=1))

    def test_single_review_requires_valid_grader_metadata(self):
        for metadata in ("", "Single grader: -\n", "Single grader: Unset\n",
                         "Single grader: Visual Review\n", "Single grader: visual\nSingle grader: assets\n"):
            with self.subTest(metadata=metadata):
                self.write_records(review="Mode: Single\nSelected: 2026-10-30\n" + metadata)
                self.assertIn("Single review mode requires", self.launch(expected=1))
        self.write_records(review=(
            "Mode: Single\nSelected: 2026-10-30\nSingle grader: visual-review\n"
        ))
        self.launch()

    def test_all_review_mode_does_not_require_single_metadata(self):
        self.write_records(review="Mode: All\nSelected: 2026-10-30\n")
        self.launch()

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

    def test_production_lock_timestamp_is_idempotent_on_available_powershells(self):
        for shell in POWERSHELLS:
            with self.subTest(shell=shell):
                command = (
                    "$p=Get-Process -Id {0}; "
                    "[pscustomobject]@{{processName=$p.ProcessName; "
                    "processStartedAt=$p.StartTime.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress"
                ).format(os.getpid())
                result = subprocess.run(
                    [shell, "-NoLogo", "-NoProfile", "-Command", command],
                    capture_output=True, text=True, timeout=30,
                )
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                process = json.loads(result.stdout)
                self.lock.write_text(json.dumps({
                    "pid": os.getpid(), "processName": process["processName"],
                    "processStartedAt": process["processStartedAt"],
                    "project": str(self.project), "blend": "", "port": self.port,
                }), encoding="utf-8")
                before = self.snapshot()
                output = self.run_script_with(shell, "start-blender.ps1", "-Project", self.project,
                                              "-BlenderExe", self.fake_exe, "-DryRun")
                self.assertIn("Already running", output)
                self.assertEqual(before, self.snapshot())

    def test_malformed_lock_pid_is_recovered(self):
        for pid in ("not-a-pid", 0, -1, 2147483648, [os.getpid()], {"value": os.getpid()}):
            with self.subTest(pid=pid):
                self.lock.write_text(json.dumps({"pid": pid}), encoding="utf-8")
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

    def test_scaffold_rejects_collection_junction(self):
        original = self.root / "Blender"
        moved = self.root / "Original projects"
        original.rename(moved)
        command = "New-Item -ItemType Junction -Path '{}' -Target '{}' | Out-Null".format(
            str(original).replace("'", "''"), str(moved).replace("'", "''")
        )
        result = subprocess.run([POWERSHELL, "-NoProfile", "-Command", command],
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.addCleanup(lambda: original.rmdir() if original.exists() else None)
        output = self.run_script("new-blender-project.ps1", "-Name", "Escaped", expected=1)
        self.assertIn("symbolic links or junctions", output)
        self.assertFalse((moved / "Escaped").exists())

    def test_scaffold_failure_does_not_leave_partial_destination(self):
        template_readme = self.root / TEMPLATE / "README.md"
        template_readme.write_text("{{UNKNOWN_TOKEN}}", encoding="utf-8")
        output = self.run_script("new-blender-project.ps1", "-Name", "Broken", expected=1)
        self.assertIn("Unknown template token", output)
        self.assertFalse((self.root / "Blender/Broken").exists())
        self.assertIn("Unknown template token", self.run_script(
            "new-blender-project.ps1", "-Name", "Broken", expected=1
        ))

    def test_scaffold_copy_failure_cleans_only_new_destination(self):
        locked = self.root / TEMPLATE / "locked.bin"
        locked.write_bytes(b"Locked template fixture")
        existing = self.root / "Blender/Existing"
        existing.mkdir()
        sentinel = existing / "keep.txt"
        sentinel.write_text("Existing project must survive", encoding="utf-8")
        script = str(self.root / "tools/new-blender-project.ps1").replace("'", "''")
        source = str(locked).replace("'", "''")
        command = (
            "$held=[System.IO.File]::Open('{0}',[System.IO.FileMode]::Open,"
            "[System.IO.FileAccess]::Read,[System.IO.FileShare]::None); "
            "try {{ & '{1}' -Name Broken }} finally {{ $held.Dispose() }}"
        ).format(source, script)
        result = subprocess.run([POWERSHELL, "-NoLogo", "-NoProfile", "-Command", command],
                                cwd=self.root, capture_output=True, text=True, timeout=30)
        self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("locked.bin", result.stdout + result.stderr)
        self.assertFalse((self.root / "Blender/Broken").exists())
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "Existing project must survive")
        self.assertIn("Project already exists", self.run_script(
            "new-blender-project.ps1", "-Name", "Existing", expected=1
        ))
        self.assertTrue(sentinel.is_file())

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
    @staticmethod
    def permission_action(permissions, tool, target="*"):
        result = "ask"
        for pattern, rules in permissions.items():
            tool_pattern = re.escape(pattern).replace(r"\*", ".*").replace(r"\?", ".")
            if not re.fullmatch(tool_pattern, tool):
                continue
            if isinstance(rules, str):
                result = rules
                continue
            for path_pattern, action in rules.items():
                expression = re.escape(path_pattern).replace(r"\*", ".*").replace(r"\?", ".")
                if re.fullmatch(expression, target):
                    result = action
        return result

    def test_python_tools_parse_without_creating_bytecode(self):
        for path in (ROOT / "tools").glob("*.py"):
            with self.subTest(path=path.name):
                tree = ast.parse(path.read_text(encoding="utf-8-sig"), filename=str(path))
                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        methods = [item.name for item in node.body
                                   if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))]
                        self.assertEqual(len(methods), len(set(methods)), f"Duplicate method in {node.name}")

    def test_template_tokens_and_internal_links(self):
        allowed = {"PROJECT_NAME", "PROJECT_SLUG", "DATE", "DESCRIPTION", "GOAL", "GOAL_TITLE"}
        for path in (ROOT / TEMPLATE).rglob("*.md"):
            text = path.read_text(encoding="utf-8")
            with self.subTest(path=str(path.relative_to(ROOT / TEMPLATE))):
                self.assertLessEqual(set(re.findall(r"\{\{([A-Z_]+)\}\}", text)), allowed)
                for target in re.findall(r"\]\(([^)]+)\)", text):
                    if "://" not in target and not target.startswith("#"):
                        self.assertTrue((path.parent / target.split("#", 1)[0]).exists(), target)

    def test_skill_sibling_template_references_resolve(self):
        references = {
            "blender-assets": "../blender-project-scaffold/templates/project/assets/external/SOURCE_TEMPLATE.md",
            "blender-project-goal": "../blender-project-scaffold/templates/project/Documents/Goals/01-project-brief.md",
            "blender-project-readme": "../blender-project-scaffold/templates/project/README.md",
        }
        for name, relative in references.items():
            skill = ROOT / ".kilo/skills" / name
            with self.subTest(skill=name):
                self.assertTrue((skill / relative).is_file())
                self.assertIn(relative, (skill / "SKILL.md").read_text(encoding="utf-8"))

    def test_workspace_markdown_links_resolve(self):
        tracked = subprocess.run(["git", "-C", str(ROOT), "ls-files", "-z", "--", "*.md"],
                                 check=True, capture_output=True).stdout.decode("utf-8").split("\0")
        for name in filter(None, tracked):
            path = ROOT / name
            for target in re.findall(r"\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
                if "://" in target or target.startswith("#"):
                    continue
                with self.subTest(path=name, target=target):
                    self.assertTrue((path.parent / target.split("#", 1)[0]).exists())

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
                self.assertLessEqual(set(metadata), {
                    "name", "description", "license", "compatibility", "metadata", "allowed-tools"
                })
                if "compatibility" in metadata:
                    self.assertIsInstance(metadata["compatibility"], str)
                    self.assertTrue(1 <= len(metadata["compatibility"]) <= 500)
                if "metadata" in metadata:
                    self.assertIsInstance(metadata["metadata"], dict)
                    self.assertTrue(all(isinstance(key, str) and isinstance(value, str)
                                        for key, value in metadata["metadata"].items()))
                self.assertTrue(text.split("---", 2)[2].strip())

    @unittest.skipUnless(yaml, "PyYAML required for agent frontmatter validation")
    def test_agent_frontmatter_and_default_permissions(self):
        supported = {"description", "mode", "steps", "hidden", "permission", "model", "variant",
                     "temperature", "top_p", "color", "disable", "options", "prompt"}
        for path in (ROOT / ".kilo/agent").glob("*.md"):
            with self.subTest(agent=path.stem):
                text = path.read_text(encoding="utf-8")
                self.assertTrue(text.startswith("---\n"))
                metadata = yaml.safe_load(text.split("---", 2)[1])
                self.assertLessEqual(set(metadata), supported)
                self.assertIsInstance(metadata["description"], str)
                self.assertTrue(metadata["description"].strip())
                self.assertEqual(metadata["mode"], "subagent")
                self.assertIs(metadata["hidden"], True)
                self.assertIs(type(metadata["steps"]), int)
                self.assertGreater(metadata["steps"], 0)
                permissions = metadata["permission"]
                self.assertEqual(next(iter(permissions.items())), ("*", "deny"))
                for tool in ("future_mutation_tool", "notify_user", "send_file", "blender_import_asset",
                             "blender_disable_telemetry", "mediamcp_generate_video", "generate_image"):
                    self.assertEqual(self.permission_action(permissions, tool), "deny", tool)
                for tool in ("read", "glob", "grep"):
                    target = "Blender/Example/Documents/Reviews/R01-20261031T081500Z/_evidence/scene.txt"
                    self.assertEqual(self.permission_action(permissions, tool, target), "allow", tool)
                    self.assertEqual(self.permission_action(permissions, tool, "config.json"), "deny", tool)
                    self.assertEqual(self.permission_action(permissions, tool, ".git/config"), "deny", tool)
                self.assertEqual(self.permission_action(permissions, "context7_query-docs"), "allow")

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
                roles = json.loads(path.read_text(encoding="utf-8-sig"))["blender_subagents"]
                if "workers" not in roles:
                    self.assertNotEqual(path.name, "config.example.json")
                    continue
                config = roles["workers"]
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

    def test_subagent_roles_share_namespace(self):
        for path in (ROOT / "config.example.json", ROOT / "config.json"):
            if not path.exists():
                continue
            with self.subTest(config=path.name):
                config = json.loads(path.read_text(encoding="utf-8-sig"))
                self.assertNotIn("blender_graders", config)
                roles = config["blender_subagents"]
                self.assertIsInstance(roles, dict)
                self.assertLessEqual(set(roles), {"workers", "graders"})
                if path.name == "config.example.json":
                    self.assertEqual(set(roles), {"workers", "graders"})
                for role in roles.values():
                    self.assertIsInstance(role, dict)

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
        allow_index = edit_rules.index(("Blender/*/Documents/Reviews/R*-*/*/REPORT.md", "allow"))
        self.assertGreater(allow_index, edit_rules.index(("*", "deny")))
        for pattern in ("Blender/**/Documents/Reviews/**/_evidence/**",
                        "Blender/**/Documents/Reviews/**/tmp/**"):
            self.assertIn((pattern, "deny"), edit_rules)
            self.assertGreater(edit_rules.index((pattern, "deny")), allow_index)
        base = "Blender/Example/Documents/Reviews/R01-20261031T081500Z"
        self.assertEqual(self.permission_action(permissions, "edit", base + "/visual/REPORT.md"), "allow")
        for target in (base + "/REVIEW.md", base + "/manifest.json", base + "/README.md",
                       base + "/_evidence/visual/REPORT.md", base + "/tmp/visual/REPORT.md",
                       "AGENTS.md", "Blender/Example/example.blend"):
            self.assertEqual(self.permission_action(permissions, "edit", target), "deny", target)
        body = (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8")
        for expected in ("REPORT.md", "PASS", "CHANGES_REQUIRED", "BLOCKED"):
            self.assertIn(expected, body)
        self.assertNotIn("Binary verdict", body)
        self.assertNotIn("valid but unusual", body)
        self.assertIn("do not read other graders' reports from the current round", body)
        self.assertIn("Read only the prior reports explicitly named for re-review", body)

    @unittest.skipUnless(yaml, "PyYAML required for embedded config validation")
    def test_embedded_roster_examples_obey_parallel_budget(self):
        for name in ("blender-subagents", "blender-project-grading"):
            text = (ROOT / f".kilo/skills/{name}/SKILL.md").read_text(encoding="utf-8")
            grader_examples = 0
            for snippet in re.findall(r"```json\n(.*?)\n```", text, flags=re.DOTALL):
                config = json.loads(snippet)
                self.assertEqual(set(config), {"blender_subagents"}, name)
                roles = config["blender_subagents"]
                self.assertTrue(roles, name)
                self.assertLessEqual(set(roles), {"workers", "graders"}, name)
                if "graders" in roles:
                    grader_examples += 1
                    graders = roles["graders"]
                    self.assertLessEqual(graders["max_parallel"], len(graders["graders"]), name)
            self.assertGreater(grader_examples, 0, name)

    def test_review_round_names_and_approval_gates_are_dynamic(self):
        paths = [ROOT / ".kilo/skills/blender-project-grading/SKILL.md",
                 ROOT / TEMPLATE / "Documents/Reviews/README.md"]
        for path in paths:
            with self.subTest(path=path.name):
                text = path.read_text(encoding="utf-8")
                self.assertIn("R<NN>-<yyyyMMddTHHmmssZ>", text)
                self.assertIn("UTC", text)
                self.assertNotRegex(text, r"R\d+-\d{8}T\d{6}Z")
        grading = paths[0].read_text(encoding="utf-8")
        self.assertIn("project-wide sequence", grading)
        self.assertIn("before making another", grading)
        self.assertIn("never rewrite a failed verdict", grading)
        self.assertNotIn("Round: R01", grading)
        self.assertNotIn("Documents/Goals/01-project-brief.md", grading)

    @unittest.skipUnless(yaml, "PyYAML required for grader validation")
    def test_grader_config_example_is_valid(self):
        agent = yaml.safe_load(
            (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8").split("---", 2)[1]
        )
        graders = json.loads(
            (ROOT / "config.example.json").read_text(encoding="utf-8-sig")
        )["blender_subagents"]["graders"]
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
        self.assertRegex(brief, r"either mode is `Unset`|review mode is `Unset`")
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
        for text in (workflow, brief):
            self.assertIn("blender-project-goal", text)
        self.assertIn('goal_report(status="blocked"', goal)
        self.assertIn('goal(action="resume")', goal)
        self.assertIn('goal(action="start", objective=', goal)
        self.assertIn("`question` is unavailable", workflow)
        self.assertIn("ordinary chat", goal)
        self.assertIn("entire filled prompt", goal)
        self.assertIn("this entire filled prompt", brief)

    def test_agent_instructions_keep_goal_controls_with_orchestrator(self):
        paths = [ROOT / "AGENTS.md", *sorted((ROOT / ".kilo/skills").rglob("*.md"))]
        for path in paths:
            with self.subTest(path=str(path.relative_to(ROOT))):
                text = path.read_text(encoding="utf-8")
                self.assertFalse(re.search(r"(?<![\w])/goal(?:[\s`]|$)", text),
                                 "Goal slash commands must not be assigned to the user")
                self.assertFalse(re.search(r'goal\(action=["\'](?:pause|clear|update)["\']', text),
                                 "Only supported goal actions may be documented")
        goal = (ROOT / ".kilo/skills/blender-project-goal/SKILL.md").read_text(encoding="utf-8")
        for expected in ("orchestrator owns", "already paused", "no successful action",
                         "next ordinary user turn", "not approval", "registration",
                         "A final response alone does not prove", "runtime receipt"):
            self.assertIn(expected, goal)

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

    def test_reference_python_examples_parse(self):
        references = ROOT / ".kilo/skills/blender-mcp/references"
        for path in references.glob("*.md"):
            text = path.read_text(encoding="utf-8")
            for index, snippet in enumerate(re.findall(
                    r"^[ \t]*```python\n(.*?)^[ \t]*```", text, flags=re.MULTILINE | re.DOTALL)):
                lines = snippet.splitlines()
                indentation = min((len(line) - len(line.lstrip()) for line in lines if line.strip()), default=0)
                source = "\n".join(line[indentation:] for line in lines)
                with self.subTest(path=path.name, example=index):
                    ast.parse(source, filename=f"{path.name}:example-{index}")

    def test_animation_example_handles_missing_slot_without_import(self):
        from types import SimpleNamespace

        guide = (ROOT / ".kilo/skills/blender-mcp/references/animation.md").read_text(encoding="utf-8")
        snippet = next(code for code in re.findall(r"```python\n(.*?)\n```", guide, flags=re.DOTALL)
                       if "def fcurves(obj):" in code)
        namespace = {}
        exec(compile(snippet, "animation.md:fcurves", "exec"), namespace)
        fcurves = namespace["fcurves"]
        self.assertEqual(fcurves(SimpleNamespace(animation_data=None)), [])
        self.assertEqual(fcurves(SimpleNamespace(animation_data=SimpleNamespace(action=None))), [])
        layered = SimpleNamespace(action=SimpleNamespace(is_action_layered=True), action_slot=None)
        self.assertEqual(fcurves(SimpleNamespace(animation_data=layered)), [])
        legacy = SimpleNamespace(action=SimpleNamespace(is_action_layered=False, fcurves=["curve"]))
        self.assertEqual(fcurves(SimpleNamespace(animation_data=legacy)), ["curve"])


if __name__ == "__main__":
    unittest.main()
