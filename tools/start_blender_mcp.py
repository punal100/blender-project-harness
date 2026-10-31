import bpy
import os
import socket
import traceback
from bpy.app.handlers import persistent

PORT = int(os.environ.get("BLENDER_PORT", "9876"))
MAX_START_ATTEMPTS = 5
RETRY_INTERVAL = 0.5
_start_attempts = 0


def apply_port(*_args):
    global _start_attempts
    _start_attempts += 1
    try:
        scene = bpy.context.scene
        if scene is None:
            raise RuntimeError("No active scene available for MCP startup")

        server = getattr(bpy.types, "blendermcp_server", None)
        if server is not None or getattr(scene, "blendermcp_server_running", False):
            try:
                if "FINISHED" not in bpy.ops.blendermcp.stop_server():
                    raise RuntimeError("MCP stop operator did not finish")
            except Exception:
                if server is None:
                    raise
                server.stop()
            remaining = getattr(bpy.types, "blendermcp_server", None)
            if remaining is not None:
                if getattr(remaining, "running", False):
                    remaining.stop()
                if getattr(remaining, "running", False):
                    raise RuntimeError("Existing MCP server did not stop")
                del bpy.types.blendermcp_server
            scene.blendermcp_server_running = False

        scene.blendermcp_port = PORT
        result = bpy.ops.blendermcp.start_server()
        server = getattr(bpy.types, "blendermcp_server", None)
        listener = getattr(server, "socket", None)
        if ("FINISHED" not in result or not getattr(server, "running", False)
                or not getattr(scene, "blendermcp_server_running", False)
                or getattr(server, "port", None) != PORT or listener is None
                or listener.getsockname()[1] != PORT
                or not listener.getsockopt(socket.SOL_SOCKET, socket.SO_ACCEPTCONN)):
            raise RuntimeError(f"MCP server is not listening on requested port {PORT}")
        print(f"BlenderMCP: listening on port {PORT}", flush=True)
    except Exception:
        traceback.print_exc()
        if _start_attempts < MAX_START_ATTEMPTS:
            return RETRY_INTERVAL
        print(f"BlenderMCP: startup stopped after {MAX_START_ATTEMPTS} attempts", flush=True)
    return None


def schedule_apply_port(*_args):
    global _start_attempts
    _start_attempts = 0
    if not bpy.app.timers.is_registered(apply_port):
        bpy.app.timers.register(apply_port, first_interval=0.4, persistent=True)


@persistent
def restart_after_load(*_args):
    schedule_apply_port()


restart_after_load._kilo_blender_mcp_apply_port = apply_port
for handler in list(bpy.app.handlers.load_post):
    previous_timer = getattr(handler, "_kilo_blender_mcp_apply_port", None)
    if previous_timer is not None:
        if bpy.app.timers.is_registered(previous_timer):
            bpy.app.timers.unregister(previous_timer)
        bpy.app.handlers.load_post.remove(handler)
bpy.app.handlers.load_post.append(restart_after_load)
schedule_apply_port()
