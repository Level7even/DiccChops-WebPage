import bpy
import os
import math
from mathutils import Vector

# Clear existing objects (optional - comment out if you want to keep existing scene)
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

# Create a bounding box for alignment
def create_bounding_box():
    # Create a cube for bounding box
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))
    bbox = bpy.context.active_object
    bbox.name = "Tile_Bounding_Box"
    
    # Make it wireframe and non-renderable
    bbox.display_type = 'WIRE'
    bbox.hide_render = True
    
    # Add a material with outline for visibility
    mat = bpy.data.materials.new(name="BBox_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    # Create emission shader for wireframe look
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (1, 0, 0, 1)  # Red
    emission.inputs['Strength'].default_value = 5.0
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    if bbox.data.materials:
        bbox.data.materials[0] = mat
    else:
        bbox.data.materials.append(mat)
    
    return bbox

# Set up camera at specific angle
def setup_camera(direction_name, angle_deg, elevation=60):
    # Create camera
    bpy.ops.object.camera_add(location=(0, 0, 0))
    camera = bpy.context.active_object
    camera.name = f"Camera_{direction_name}"
    
    # Calculate position based on angle
    angle_rad = math.radians(angle_deg)
    elevation_rad = math.radians(elevation)
    
    # Distance from origin - adjust based on bounding box size
    distance = 10
    
    # Calculate camera position
    x = math.cos(angle_rad) * distance
    y = math.sin(angle_rad) * distance
    z = math.sin(elevation_rad) * distance
    
    camera.location = (x, y, z)
    
    # Point camera at origin
    bpy.context.view_layer.objects.active = camera
    bpy.ops.object.constraint_add(type='TRACK_TO')
    camera.constraints["Track To"].target = None  # Will track origin
    camera.constraints["Track To"].track_axis = 'TRACK_NEGATIVE_Z'
    camera.constraints["Track To"].up_axis = 'UP_Y'
    
    # Set camera to orthographic
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 5  # Adjust based on bounding box
    
    return camera

# Set up lighting
def setup_lighting():
    # Clear existing lights
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            obj.select_set(True)
    bpy.ops.object.delete()
    
    # Add main directional light (mimics Project Zomboid lighting)
    bpy.ops.object.light_add(type='SUN', location=(10, 10, 20))
    sun = bpy.context.active_object
    sun.name = "Main_Sun"
    sun.data.energy = 2.0
    sun.data.color = (1.0, 0.95, 0.9)  # Slightly warm light
    
    # Rotate for top-down isometric angle
    sun.rotation_euler = (math.radians(60), 0, math.radians(45))
    
    # Add fill light
    bpy.ops.object.light_add(type='SUN', location=(-10, -10, 15))
    fill = bpy.context.active_object
    fill.name = "Fill_Light"
    fill.data.energy = 0.5
    fill.data.color = (0.9, 0.95, 1.0)  # Slightly cool
    
    # Add ambient occlusion
    bpy.context.scene.world.use_nodes = True
    world_nodes = bpy.context.scene.world.node_tree.nodes
    world_links = bpy.context.scene.world.node_tree.links
    
    # Clear default nodes
    world_nodes.clear()
    
    # Add background node
    bg = world_nodes.new(type='ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.1, 0.1, 0.1, 1)  # Dark gray ambient
    bg.inputs['Strength'].default_value = 0.3
    
    output = world_nodes.new(type='ShaderNodeOutputWorld')
    world_links.new(bg.outputs['Background'], output.inputs['Surface'])

# Configure render settings for Project Zomboid
def configure_render_settings():
    scene = bpy.context.scene
    
    # Set render engine to Cycles for better quality
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    
    # Set resolution to tile size
    scene.render.resolution_x = 128
    scene.render.resolution_y = 256
    
    # Square pixels
    scene.render.pixel_aspect_x = 1
    scene.render.pixel_aspect_y = 1
    
    # Transparent background
    scene.render.film_transparent = True
    
    # Output settings
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.image_settings.compression = 15  # Lower compression = faster

# Render tiles from camera with offsets
def render_tiles_from_camera(camera, direction_name, output_dir):
    scene = bpy.context.scene
    original_camera = scene.camera
    
    # Set current camera
    scene.camera = camera
    
    # Get bounding box to calculate alignment
    bbox = bpy.data.objects.get("Tile_Bounding_Box")
    if bbox:
        # Calculate camera ortho scale based on bounding box
        bbox_dimensions = bbox.dimensions
        max_dim = max(bbox_dimensions.x, bbox_dimensions.y, bbox_dimensions.z)
        camera.data.ortho_scale = max_dim * 1.2  # 20% margin
    
    # Primary tile (center)
    scene.render.filepath = os.path.join(output_dir, f"{direction_name}_center.png")
    bpy.ops.render.render(write_still=True)
    
    # Tile to the left
    camera.location.x -= camera.data.ortho_scale
    scene.render.filepath = os.path.join(output_dir, f"{direction_name}_left.png")
    bpy.ops.render.render(write_still=True)
    
    # Tile to the right
    camera.location.x += camera.data.ortho_scale * 2  # Go back to center then right
    scene.render.filepath = os.path.join(output_dir, f"{direction_name}_right.png")
    bpy.ops.render.render(write_still=True)
    
    # Tile above
    camera.location.x -= camera.data.ortho_scale  # Back to center
    camera.location.y += camera.data.ortho_scale * (256/128)  # Adjust for 2:1 aspect ratio
    scene.render.filepath = os.path.join(output_dir, f"{direction_name}_above.png")
    bpy.ops.render.render(write_still=True)
    
    # Restore original position
    camera.location.y -= camera.data.ortho_scale * (256/128)
    
    # Restore original camera
    scene.camera = original_camera

# Main function
def create_pz_tiles():
    # Get the active object (should be your model)
    model = bpy.context.active_object
    if not model or model.type != 'MESH':
        print("Please select a mesh object")
        return
    
    # Create output directory
    output_dir = bpy.path.abspath("//PZ_Tiles/")
    os.makedirs(output_dir, exist_ok=True)
    
    # Center model at origin
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    model.location = (0, 0, 0)
    
    # Create bounding box for alignment
    bbox = create_bounding_box()
    
    # Parent model to bounding box for easy scaling
    model.parent = bbox
    
    # Configure render settings
    configure_render_settings()
    
    # Set up lighting
    setup_lighting()
    
    # Camera directions (8 angles)
    directions = [
        ("N", 90),
        ("NE", 45),
        ("E", 0),
        ("SE", -45),
        ("S", -90),
        ("SW", -135),
        ("W", 180),
        ("NW", 135)
    ]
    
    # Create and render from each camera
    cameras = []
    for direction_name, angle in directions:
        camera = setup_camera(direction_name, angle)
        cameras.append(camera)
        
        # Adjust camera to align model bottom with tile bottom
        if bbox:
            # Calculate offset to align bottom of bounding box with bottom of tile
            bbox_min_z = min(v[2] for v in bbox.bound_box)
            camera_z_offset = bbox_min_z
            
            # Adjust camera to frame the bounding box
            bbox_dimensions = bbox.dimensions
            camera.data.ortho_scale = max(bbox_dimensions.x, bbox_dimensions.y) * 1.5
        
        # Render tiles from this camera
        render_tiles_from_camera(camera, direction_name, output_dir)
    
    print(f"Rendering complete! Files saved to: {output_dir}")
    
    # Create a simple tile sheet arrangement guide
    create_arrangement_guide(output_dir, directions)

# Create a guide for arranging the tiles
def create_arrangement_guide(output_dir, directions):
    guide = """Project Zomboid Tile Arrangement Guide
==========================================

For each direction, you have 4 tiles:
1. center.png - Main tile
2. left.png - Tile to the left
3. right.png - Tile to the right
4. above.png - Tile above

To create a complete tile sheet for a direction (e.g., N):

    +-----------+
    |   above   |
+---+-----------+---+
|left|  center  |right|
+---+-----------+---+

Combine them in an image editor to create:
- A 384x512 image (3 wide × 2 high tiles) for each direction

For Project Zomboid modding, you'll typically need:
- 8 directions × 4 tiles each = 32 individual images

Note: Adjust the bounding box to control how much of the model fits in the tile.
The bottom of the bounding box will align with the bottom of the center tile.
"""
    
    with open(os.path.join(output_dir, "ARRANGEMENT_GUIDE.txt"), "w") as f:
        f.write(guide)

# UI Panel for easy access
class PZTilePanel(bpy.types.Panel):
    bl_label = "Project Zomboid Tile Generator"
    bl_idname = "PT_PZ_Tiles"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Tool"
    
    def draw(self, context):
        layout = self.layout
        
        layout.label(text="Project Zomboid Tile Setup")
        
        if bpy.context.active_object and bpy.context.active_object.type == 'MESH':
            layout.operator("object.create_pz_tiles", text="Generate PZ Tiles")
            layout.separator()
            
            bbox = bpy.data.objects.get("Tile_Bounding_Box")
            if bbox:
                layout.label(text="Adjust Bounding Box:")
                layout.prop(bbox, "scale")
                layout.prop(bbox, "location")
            else:
                layout.operator("object.create_bounding_box", text="Create Bounding Box")
        else:
            layout.label(text="Select a mesh object first")

class CreatePZTilesOperator(bpy.types.Operator):
    bl_idname = "object.create_pz_tiles"
    bl_label = "Generate Project Zomboid Tiles"
    
    def execute(self, context):
        create_pz_tiles()
        return {'FINISHED'}

class CreateBoundingBoxOperator(bpy.types.Operator):
    bl_idname = "object.create_bounding_box"
    bl_label = "Create Bounding Box"
    
    def execute(self, context):
        create_bounding_box()
        return {'FINISHED'}

# Register the addon
def register():
    bpy.utils.register_class(PZTilePanel)
    bpy.utils.register_class(CreatePZTilesOperator)
    bpy.utils.register_class(CreateBoundingBoxOperator)

def unregister():
    bpy.utils.unregister_class(PZTilePanel)
    bpy.utils.unregister_class(CreatePZTilesOperator)
    bpy.utils.unregister_class(CreateBoundingBoxOperator)

if __name__ == "__main__":
    register()
    
    # Auto-run if you want (comment out to use UI panel only)
    # create_pz_tiles()