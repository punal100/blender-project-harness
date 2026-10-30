import bpy
import os
import traceback

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


bpy.app.handlers.load_post.append(
    lambda *_: bpy.app.timers.register(apply_port, first_interval=0.4)
)
bpy.app.timers.register(apply_port, first_interval=0.4)
