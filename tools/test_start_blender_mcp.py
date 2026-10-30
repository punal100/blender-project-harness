import contextlib
import io
import os
from pathlib import Path
import runpy
import sys
import types
import unittest
from unittest.mock import Mock, patch


SCRIPT = Path(__file__).with_name("start_blender_mcp.py")


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.handlers = types.ModuleType("bpy.app.handlers")
        self.handlers.load_post = []

        def persistent(callback):
            callback._bpy_persistent = True
            return callback

        self.handlers.persistent = persistent
        self.registered = {}
        timers = types.SimpleNamespace(
            is_registered=lambda callback: callback in self.registered,
            register=lambda callback, **options: self.registered.update({callback: options}),
            unregister=lambda callback: self.registered.pop(callback),
        )
        self.bpy = types.ModuleType("bpy")
        self.bpy.app = types.ModuleType("bpy.app")
        self.bpy.app.handlers = self.handlers
        self.bpy.app.timers = timers
        self.bpy.context = types.SimpleNamespace(scene=types.SimpleNamespace())
        self.bpy.types = types.SimpleNamespace()
        self.bpy.ops = types.SimpleNamespace(
            blendermcp=types.SimpleNamespace(start_server=Mock(), stop_server=Mock())
        )
        self.modules = patch.dict(sys.modules, {
            "bpy": self.bpy,
            "bpy.app": self.bpy.app,
            "bpy.app.handlers": self.handlers,
        })
        self.modules.start()
        self.addCleanup(self.modules.stop)
        self.environment = patch.dict(os.environ, {"BLENDER_PORT": "19877"})
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.namespace = runpy.run_path(str(SCRIPT))

    def test_initial_timer_and_load_handler_are_persistent(self):
        callback = self.namespace["apply_port"]
        self.assertEqual(self.registered[callback], {"first_interval": 0.4, "persistent": True})
        self.assertEqual(len(self.handlers.load_post), 1)
        self.assertTrue(self.handlers.load_post[0]._bpy_persistent)

    def test_load_does_not_duplicate_pending_timer(self):
        self.handlers.load_post[0](None)
        self.handlers.load_post[0](None)
        self.assertEqual(len(self.registered), 1)

    def test_load_reschedules_completed_timer(self):
        self.registered.clear()
        self.handlers.load_post[0](None)
        self.assertIn(self.namespace["apply_port"], self.registered)

    def test_reloading_bootstrap_replaces_only_owned_handler_and_timer(self):
        unrelated = lambda *_: None
        self.handlers.load_post.append(unrelated)
        self.registered[unrelated] = {}
        previous = self.namespace["apply_port"]
        new_namespace = runpy.run_path(str(SCRIPT))
        self.assertNotIn(previous, self.registered)
        self.assertIn(new_namespace["apply_port"], self.registered)
        self.assertIn(unrelated, self.handlers.load_post)
        self.assertIn(unrelated, self.registered)
        self.assertEqual(len(self.handlers.load_post), 2)

    def test_missing_scene_retries_without_starting(self):
        self.bpy.context.scene = None
        self.assertEqual(self.namespace["apply_port"](), 0.5)
        self.bpy.ops.blendermcp.start_server.assert_not_called()

    def test_port_is_applied_before_server_start(self):
        self.bpy.ops.blendermcp.start_server.side_effect = lambda: self.assertEqual(
            self.bpy.context.scene.blendermcp_port, 19877
        )
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertIsNone(self.namespace["apply_port"]())
        self.bpy.ops.blendermcp.start_server.assert_called_once_with()

    def test_running_server_is_stopped(self):
        self.bpy.context.scene.blendermcp_server_running = True
        with contextlib.redirect_stdout(io.StringIO()):
            self.namespace["apply_port"]()
        self.bpy.ops.blendermcp.stop_server.assert_called_once_with()

    def test_failed_stop_uses_server_fallback(self):
        server = types.SimpleNamespace(running=True, stop=Mock())
        self.bpy.types.blendermcp_server = server
        self.bpy.ops.blendermcp.stop_server.side_effect = RuntimeError("operator failed")
        with contextlib.redirect_stdout(io.StringIO()):
            self.namespace["apply_port"]()
        server.stop.assert_called_once_with()
        self.assertFalse(hasattr(self.bpy.types, "blendermcp_server"))

    def test_start_failure_reports_error(self):
        self.bpy.ops.blendermcp.start_server.side_effect = RuntimeError("addon unavailable")
        errors = io.StringIO()
        with contextlib.redirect_stderr(errors):
            self.assertIsNone(self.namespace["apply_port"]())
        self.assertIn("addon unavailable", errors.getvalue())


if __name__ == "__main__":
    unittest.main()
