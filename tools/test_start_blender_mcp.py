import contextlib
import io
import os
from pathlib import Path
import runpy
import socket
import sys
import types
import unittest
from unittest.mock import Mock, patch


SCRIPT = Path(__file__).with_name("start_blender_mcp.py")


class BootstrapTests(unittest.TestCase):
    class ListeningSocket:
        def __init__(self, port):
            self.port = port

        def getsockname(self):
            return ("127.0.0.1", self.port)

        def getsockopt(self, level, option):
            if (level, option) == (socket.SOL_SOCKET, socket.SO_ACCEPTCONN):
                return 1
            return 0

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
            blendermcp=types.SimpleNamespace(start_server=Mock(return_value={"FINISHED"}),
                                              stop_server=Mock(return_value={"FINISHED"}))
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
        self.make_running_server()

    def make_running_server(self, port=19877, running=True):
        server = types.SimpleNamespace(
            running=running,
            port=port,
            socket=self.ListeningSocket(port) if running else None,
            stop=Mock(side_effect=lambda: setattr(server, "running", False)),
        )
        self.bpy.types.blendermcp_server = server

        def start_server():
            replacement = types.SimpleNamespace(
                running=True,
                port=self.bpy.context.scene.blendermcp_port,
                socket=self.ListeningSocket(self.bpy.context.scene.blendermcp_port),
            )
            replacement.stop = Mock(side_effect=lambda: setattr(replacement, "running", False))
            self.bpy.context.scene.blendermcp_server_running = True
            self.bpy.types.blendermcp_server = replacement
            return {"FINISHED"}

        self.bpy.ops.blendermcp.start_server.side_effect = start_server
        return server

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
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(self.namespace["apply_port"](), 0.5)
        self.bpy.ops.blendermcp.start_server.assert_not_called()

    def test_port_is_applied_before_server_start(self):
        start = self.bpy.ops.blendermcp.start_server.side_effect

        def start_server():
            self.assertEqual(self.bpy.context.scene.blendermcp_port, 19877)
            return start()

        self.bpy.ops.blendermcp.start_server.side_effect = start_server
        self.bpy.types.blendermcp_server = types.SimpleNamespace(
            running=False, port=9876, socket=None, stop=Mock()
        )
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertIsNone(self.namespace["apply_port"]())
        self.bpy.ops.blendermcp.start_server.assert_called_once_with()

    def test_running_server_is_stopped(self):
        self.make_running_server()
        self.bpy.context.scene.blendermcp_server_running = True
        with contextlib.redirect_stdout(io.StringIO()):
            self.namespace["apply_port"]()
        self.bpy.ops.blendermcp.stop_server.assert_called_once_with()

    def test_failed_stop_uses_server_fallback(self):
        server = types.SimpleNamespace(running=True, port=9876, socket=None)
        server.stop = Mock(side_effect=lambda: setattr(server, "running", False))
        self.bpy.types.blendermcp_server = server
        self.bpy.ops.blendermcp.stop_server.side_effect = RuntimeError("operator failed")
        with contextlib.redirect_stdout(io.StringIO()):
            self.namespace["apply_port"]()
        server.stop.assert_called_once_with()
        self.assertTrue(self.bpy.types.blendermcp_server.running)
        self.assertEqual(self.bpy.types.blendermcp_server.port, 19877)

    def test_start_failure_reports_error(self):
        self.bpy.ops.blendermcp.start_server.side_effect = RuntimeError("addon unavailable")
        errors = io.StringIO()
        with contextlib.redirect_stderr(errors):
            self.assertEqual(self.namespace["apply_port"](), 0.5)
        self.assertIn("addon unavailable", errors.getvalue())

    def test_stopped_server_is_recreated_on_requested_port(self):
        stale = self.make_running_server(port=9876, running=False)
        with contextlib.redirect_stdout(io.StringIO()) as output:
            result = self.namespace["apply_port"]()
        self.assertIsNone(result)
        current = self.bpy.types.blendermcp_server
        self.assertIsNot(current, stale)
        self.assertEqual(current.port, 19877)
        self.assertTrue(current.running)
        self.assertIn("listening on port 19877", output.getvalue())

    def test_false_start_state_retries_and_then_stops(self):
        self.bpy.types.blendermcp_server = types.SimpleNamespace(
            running=False, port=9876, socket=None, stop=Mock()
        )
        self.bpy.ops.blendermcp.start_server.side_effect = lambda: {"FINISHED"}
        errors = io.StringIO()
        output = io.StringIO()
        with contextlib.redirect_stderr(errors), contextlib.redirect_stdout(output):
            results = [self.namespace["apply_port"]()
                       for _ in range(self.namespace["MAX_START_ATTEMPTS"])]
        self.assertEqual(results, [0.5] * (self.namespace["MAX_START_ATTEMPTS"] - 1) + [None])
        self.assertEqual(self.bpy.ops.blendermcp.start_server.call_count,
                         self.namespace["MAX_START_ATTEMPTS"])
        self.assertIn("not listening", errors.getvalue())
        self.assertIn("startup stopped after", output.getvalue())
        self.assertNotIn("BlenderMCP: listening", output.getvalue())

    def test_cancelled_start_never_reports_success(self):
        self.bpy.ops.blendermcp.start_server.side_effect = lambda: {"CANCELLED"}
        output = io.StringIO()
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(self.namespace["apply_port"](), 0.5)
        self.assertNotIn("BlenderMCP: listening", output.getvalue())

    def test_running_flag_without_listening_socket_is_rejected(self):
        def start_without_listener():
            self.bpy.types.blendermcp_server = types.SimpleNamespace(
                running=True, port=19877, socket=self.ListeningSocket(19877)
            )
            self.bpy.types.blendermcp_server.socket.getsockopt = lambda *_: 0
            self.bpy.context.scene.blendermcp_server_running = True
            return {"FINISHED"}

        self.bpy.ops.blendermcp.start_server.side_effect = start_without_listener
        output = io.StringIO()
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(self.namespace["apply_port"](), 0.5)
        self.assertNotIn("BlenderMCP: listening", output.getvalue())

    def test_new_load_resets_exhausted_retry_budget(self):
        self.bpy.ops.blendermcp.start_server.side_effect = RuntimeError("unavailable")
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            for _ in range(self.namespace["MAX_START_ATTEMPTS"]):
                self.namespace["apply_port"]()
            self.handlers.load_post[0](None)
            self.assertIn(self.namespace["apply_port"], self.registered)
            self.assertEqual(self.namespace["apply_port"](), 0.5)


if __name__ == "__main__":
    unittest.main()
