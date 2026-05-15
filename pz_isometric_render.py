import bpy
import math
import os

# --- CONFIGURATION ---
# PZ standard tile size for objects/walls is 128x256
# The floor diamond itself is 128x64
RES_X = 128
RES_Y = 256

# How many Blender Units wide is one PZ tile? 
# Usually, 1.0 or 1.14 is standard depending on your modeling scale.
UNITS_PER_TILE = 1.0 

DIRECTIONS = 8  # 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
OUTPUT_DIR = bpy.path.abspath("//renders")
CAMERA_NAME = "ZomboidCam"

class PZRenderProperties(bpy.types.PropertyGroup):
    grid_size: bpy.props.IntProperty(
        name="Grid Size",
        description="Number of tiles wide/tall (default 8)",
        default=8,
        min=1,
        max=16
    )
    directions: bpy.props.EnumProperty(
        name="Directions",
        description="Number of directions to render",
        items=[
            ('4', '4', 'N, E, S, W'),
            ('8', '8', 'N, NE, E, SE, S, SW, W, NW'),
            ('16', '16', '16 directions')
        ],
        default='8'
    )

def setup_scene():
    scene = bpy.context.scene
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    
    # Use Cycles or Eevee
    scene.render.engine = 'BLENDER_EEVEE'

class PZRenderPanel(bpy.types.Panel):
    bl_label = "Project Zomboid Render"
    bl_idname = "VIEW3D_PT_pz_render"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "PZ Render"

    def draw(self, context):
        layout = self.layout
        props = context.scene.pz_render_props
        layout.prop(props, "grid_size")
        layout.prop(props, "directions")
        total_tiles = props.grid_size * props.grid_size * int(props.directions)
        if total_tiles > 128:
            layout.label(text=f"Warning: {total_tiles} renders!", icon='ERROR')
        layout.operator("pz.render_tiles", text="Render PZ Tiles")
        layout.operator("pz.show_tile_area", text="Show Tile Area")

class PZRenderOperator(bpy.types.Operator):
    bl_idname = "pz.render_tiles"
    bl_label = "Render PZ Tiles"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        setup_scene()
        target_obj = context.active_object
        if not target_obj or target_obj.type != 'MESH':
            self.report({'ERROR'}, "Please select a Mesh object.")
            return {'CANCELLED'}
        grid_size = context.scene.pz_render_props.grid_size
        directions = int(context.scene.pz_render_props.directions)
        render_directions(target_obj, grid_size, directions)
        self.report({'INFO'}, "Done! Check your /renders folder.")
        return {'FINISHED'}

class PZShowTileAreaOperator(bpy.types.Operator):
    bl_idname = "pz.show_tile_area"
    bl_label = "Show Tile Area"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        grid_size = context.scene.pz_render_props.grid_size
        # Remove old tile area mesh if exists
        for obj in bpy.data.objects:
            if obj.name.startswith("PZ_TILE_AREA") or obj.name.startswith("PZ_BOUNDING_BOX"):
                bpy.data.objects.remove(obj, do_unlink=True)
        # Create a new mesh for the tile area
        size = UNITS_PER_TILE * grid_size
        bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
        area_obj = bpy.context.active_object
        area_obj.name = f"PZ_TILE_AREA_{grid_size}x{grid_size}"
        area_obj.display_type = 'WIRE'
        area_obj.hide_render = True
        area_obj.show_in_front = True
        area_obj.show_name = True
        area_obj.data.materials.clear()
        # Add an adjustable bounding box (cube)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
        bbox_obj = bpy.context.active_object
        bbox_obj.name = "PZ_BOUNDING_BOX"
        bbox_obj.display_type = 'WIRE'
        bbox_obj.hide_render = True
        bbox_obj.show_in_front = True
        bbox_obj.show_name = True
        # Scale the bounding box to match the tile area by default
        bbox_obj.scale = (size/2, size/2, size/2)  # User can adjust as needed
        return {'FINISHED'}

def get_camera():
    if CAMERA_NAME in bpy.data.objects:
        cam = bpy.data.objects[CAMERA_NAME]
    else:
        bpy.ops.object.camera_add()
        cam = bpy.context.active_object
        cam.name = CAMERA_NAME
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = UNITS_PER_TILE * math.sqrt(2)
    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    # Link camera to scene
    bpy.context.scene.camera = cam
    # Align camera Z so the bottom of the bounding box is at the bottom of the render
    bbox_obj = bpy.data.objects.get("PZ_BOUNDING_BOX")
    if bbox_obj:
        # Camera is looking down at 60deg, so we need to move it up so the bottom of the box is at the bottom of the frame
        # Calculate the world Z of the bottom of the bounding box
        bbox_min_z = bbox_obj.location.z - bbox_obj.scale.z
        # The camera's ortho window is centered on cam.location.z, and extends ortho_scale/2 above and below
        # So set cam.location.z so that bbox_min_z == cam.location.z - cam.data.ortho_scale/2
        cam.location.z = bbox_min_z + cam.data.ortho_scale / 2
    else:
        cam.location = (10, -10, 10)
    return cam

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def get_model_bounds(obj):
    local_coords = [obj.matrix_world @ v.co for v in obj.data.vertices]
    min_x = min([v.x for v in local_coords])
    max_x = max([v.x for v in local_coords])
    min_y = min([v.y for v in local_coords])
    max_y = max([v.y for v in local_coords])
    min_z = min([v.z for v in local_coords])
    max_z = max([v.z for v in local_coords])
    return (min_x, max_x, min_y, max_y, min_z, max_z)

def render_directions(obj, grid_size, directions):
    scene = bpy.context.scene
    ensure_dir(OUTPUT_DIR)
    cam = get_camera()

    # --- animation range ---
    start_frame = scene.frame_start
    end_frame   = scene.frame_end

    # --- compute model bounds ---
    bounds = get_model_bounds(obj)
    min_x, max_x, min_y, max_y, min_z, max_z = bounds

    width  = max_x - min_x
    depth  = max_y - min_y
    height = max_z - min_z

    # --- bounding box alignment (if present) ---
    bbox_obj = bpy.data.objects.get("PZ_BOUNDING_BOX")
    if bbox_obj:
        bbox_min_z = bbox_obj.location.z - bbox_obj.scale.z
        z_offset = bbox_min_z - min_z
    else:
        z_offset = -min_z

    # --- center model on origin and align base ---
    obj.location = (
        -(min_x + max_x) / 2,
        -(min_y + max_y) / 2,
        z_offset
    )

    # --- camera setup ---
    tile_world_size = UNITS_PER_TILE
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(width, depth) * 1.15
    # Project Zomboid isometric: 45 deg Z, 35.264 deg X (not 60)
    cam.rotation_euler = (
        math.radians(35.264),
        0,
        math.radians(45)
    )
    # Place camera at correct isometric offset (not directly above)
    iso_dist = max(width, depth, height) * 2
    cam.location = (
        iso_dist * math.cos(math.radians(45)) * math.cos(math.radians(35.264)),
        iso_dist * math.sin(math.radians(45)) * math.cos(math.radians(35.264)),
        iso_dist * math.sin(math.radians(35.264))
    )

    half = grid_size // 2

    for d in range(directions):
        angle = d * (360 / directions)
        obj.rotation_euler.z = math.radians(angle)

        angle_dir = os.path.join(OUTPUT_DIR, f"dir_{d}")
        ensure_dir(angle_dir)

        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)

            frame_dir = os.path.join(angle_dir, f"frame_{frame:03d}")
            ensure_dir(frame_dir)

            for x in range(grid_size):
                for y in range(grid_size):
                    cam.location.x = (x - half + 0.5) * tile_world_size
                    cam.location.y = (y - half + 0.5) * tile_world_size

                    filename = f"{obj.name}_d{d}_f{frame}_x{x}_y{y}.png"
                    scene.render.filepath = os.path.join(frame_dir, filename)

                    bpy.ops.render.render(write_still=True)

def register():
    bpy.utils.register_class(PZRenderProperties)
    bpy.utils.register_class(PZRenderPanel)
    bpy.utils.register_class(PZRenderOperator)
    bpy.utils.register_class(PZShowTileAreaOperator)
    bpy.types.Scene.pz_render_props = bpy.props.PointerProperty(type=PZRenderProperties)

def unregister():
    bpy.utils.unregister_class(PZRenderProperties)
    bpy.utils.unregister_class(PZRenderPanel)
    bpy.utils.unregister_class(PZRenderOperator)
    bpy.utils.unregister_class(PZShowTileAreaOperator)
    del bpy.types.Scene.pz_render_props

if __name__ == "__main__":
    register()