import ast
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest

try:
    import yaml
except ImportError:
    yaml = None


ROOT = Path(__file__).resolve().parents[3]
TEMPLATE = Path(".kilo/blender-project-harness/tools/harness/templates/project")


class IgnoreTests(unittest.TestCase):
    def test_nested_asset_metadata_not_binaries_is_trackable(self):
        for ignore in (ROOT / ".gitignore", ROOT / TEMPLATE / "gitignore"):
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
            shutil.copy2(ROOT / TEMPLATE / "gitignore", root / ".gitignore")
            shutil.copy2(ROOT / TEMPLATE / "Documents/Reviews/gitignore", reviews / ".gitignore")
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

    def test_skill_template_references_resolve(self):
        references = {
            "blender-assets": "../../../.kilo/blender-project-harness/tools/harness/templates/project/assets/external/SOURCE_TEMPLATE.md",
            "blender-project-goal": "../../../.kilo/blender-project-harness/tools/harness/templates/project/Documents/Goals/01-project-brief.md",
            "blender-project-readme": "../../../.kilo/blender-project-harness/tools/harness/templates/project/README.md",
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
            if not path.is_file():
                continue
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
                    self.assertEqual(self.permission_action(permissions, tool, ".kilo/blender-project-harness/config.json"), "deny", tool)
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
        for tool in ("task", "agent_manager", "goal", "goal_report", "goal_blender", "question", "bash",
                     "external_directory", "blender_generate_3d", "mediamcp_*", "generate_image"):
            self.assertEqual(permissions[tool], "deny", tool)
        self.assertEqual(list(permissions["edit"].items()), [("*", "deny")])
        for target in ("Blender/Example/example.blend", "Blender/Example/Documents/DECISIONS.md",
                       "Blender/Example/README.md", "AGENTS.md", ".kilo/blender-project-harness/tools/harness/plugin.mjs"):
            self.assertEqual(self.permission_action(permissions, "edit", target), "deny", target)
        for path in (ROOT / ".kilo/blender-project-harness/config.example.json", ROOT / ".kilo/blender-project-harness/config.json"):
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
        for path in (ROOT / ".kilo/blender-project-harness/config.example.json", ROOT / ".kilo/blender-project-harness/config.json"):
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
        for tool in ("task", "agent_manager", "goal", "goal_report", "goal_blender", "question", "bash",
                     "external_directory", "blender_execute_blender_code", "blender_import_asset",
                     "blender_generate_3d", "mediamcp_*", "generate_image"):
            self.assertEqual(permissions[tool], "deny", tool)
        self.assertEqual(list(permissions["edit"].items()), [("*", "deny")])
        self.assertEqual(permissions["blender_document"], "allow")
        base = "Blender/Example/Documents/Reviews/R01-20261031T081500Z"
        for target in (base + "/visual/REPORT.md", base + "/REVIEW.md", base + "/manifest.json",
                       base + "/README.md", base + "/_evidence/visual/REPORT.md",
                       base + "/tmp/visual/REPORT.md", "AGENTS.md", "Blender/Example/example.blend"):
            self.assertEqual(self.permission_action(permissions, "edit", target), "deny", target)
        body = (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8")
        for expected in ("REPORT.md", "PASS", "CHANGES_REQUIRED", "BLOCKED", "blender_document"):
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
        self.assertIn("project-wide round number", grading)
        self.assertIn("before the change commit", grading)
        self.assertIn("NEVER permit peer report reads", grading)
        self.assertNotIn("Round: R01", grading)
        self.assertNotIn("Documents/Goals/01-project-brief.md", grading)

    @unittest.skipUnless(yaml, "PyYAML required for grader validation")
    def test_grader_config_example_is_valid(self):
        agent = yaml.safe_load(
            (ROOT / ".kilo/agent/blender-grader.md").read_text(encoding="utf-8").split("---", 2)[1]
        )
        graders = json.loads(
            (ROOT / ".kilo/blender-project-harness/config.example.json").read_text(encoding="utf-8-sig")
        )["blender_subagents"]["graders"]
        self.assertEqual(graders["agent"], "blender-grader")
        self.assertIs(type(graders["enabled"]), bool)
        roster = graders["graders"]
        self.assertTrue(1 <= len(roster) <= 7)
        self.assertIs(type(graders["max_parallel"]), int)
        self.assertTrue(1 <= graders["max_parallel"] <= len(roster))
        self.assertIs(type(graders["max_rounds"]), int)
        self.assertTrue(1 <= graders["max_rounds"] <= 4)
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
        ignore = (ROOT / TEMPLATE / "Documents/Reviews/gitignore").read_text(encoding="utf-8")
        self.assertIn("**/_evidence/", ignore)
        self.assertIn("**/tmp/", ignore)
        brief = (ROOT / TEMPLATE / "Documents/Goals/01-project-brief.md").read_text(encoding="utf-8")
        self.assertIn("`../REVIEW.md`", brief)
        self.assertIn("review answers", brief)
        scaffold = (ROOT / ".kilo/skills/blender-project-scaffold/SKILL.md").read_text(encoding="utf-8")
        self.assertIn("node .kilo/blender-project-harness/tools/harness/cli.mjs scaffold", scaffold)
        self.assertIn(".kilo/blender-project-harness/tools/harness/templates/project", scaffold)
        self.assertNotIn("## Project structure", scaffold)

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
        self.assertIn('goal_blender {action:"resume"}', goal)
        self.assertIn('goal_blender {action:"start"}', goal)
        self.assertIn("`question` remains available", workflow)
        self.assertIn("ordinary chat", goal)
        self.assertIn("filled goal", goal)
        self.assertIn("this filled goal", brief)

    def test_agent_instructions_keep_goal_controls_with_orchestrator(self):
        paths = [ROOT / "AGENTS.md", *sorted((ROOT / ".kilo/skills").rglob("*.md"))]
        for path in paths:
            with self.subTest(path=str(path.relative_to(ROOT))):
                text = path.read_text(encoding="utf-8")
                self.assertFalse(re.search(r"(?<![\w])/goal\s+(?:start|resume|pause|complete|update)\b", text),
                                 "Built-in goal actions must not be assigned to the user")
                self.assertFalse(re.search(r"goal\(action=", text),
                                 "Legacy built-in goal calls must not be documented")
        goal = (ROOT / ".kilo/skills/blender-project-goal/SKILL.md").read_text(encoding="utf-8")
        for expected in ("goal_blender", "goalSource", "goalConflict", "question` remains available",
                         "registration", "A final response alone is not approval", "runtime receipt",
                         "Never call the built-in"):
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
