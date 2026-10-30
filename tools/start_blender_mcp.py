import bpy
import os
import traceback
from bpy.app.handlers import persistent

PORT = int(os.environ.get("BLENDER_PORT", "9876"))


def apply_port(*_args):
    try:
        scene = bpy.context.scene
        if scene is None:
            return 0.5

        server = getattr(bpy.types, "blendermcp_server", None)
        if getattr(scene, "blendermcp_server_running", False) or (
            server is not None and getattr(server, "running", False)
        ):
            try:
                bpy.ops.blendermcp.stop_server()
            except Exception:
                try:
                    server.stop()
                except Exception:
                    pass
                try:
                    del bpy.types.blendermcp_server
                except Exception:
                    pass

        scene.blendermcp_port = PORT
        bpy.ops.blendermcp.start_server()
        print(f"BlenderMCP: listening on port {PORT}", flush=True)
    except Exception:
        traceback.print_exc()
    return None


def schedule_apply_port(*_args):
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
