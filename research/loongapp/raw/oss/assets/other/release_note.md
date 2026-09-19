# 2026.8.12
## Loongbones Updated to Version 1.2.3
1. Add a user feedback feature

# 2026.8.4
## Loongbones Updated to Version 1.2.1
1. Added auto-save functionality, automatically saving every 10 minutes.
2. In the Skeleton Properties panel, history can now be manually cleared.

# 2026.6.23
## Loongbones Updated to Version 1.2.0
1. Added the AI Agent feature, allowing software operations and knowledge Q&A through conversation.
2. The AI Agent is a beta feature. During the testing period: registered users get 100,000 Tokens per day, VIP users get 300,000 Tokens per day, and 3,000,000 Tokens per month.
3. Registered users can choose from a limited selection of large models; VIP users can choose from more large models.
4. The AI Agent can answer knowledge questions related to skeletal animation and operate the software to create content.
5. The AI Agent can currently perform some operations, such as: creating bones, creating slots, creating vector display objects, adding constraints, switching animation modes, adjusting the playhead position, and setting keyframes. More capabilities can be explored. Image meshing, auto-binding, and auto-weighting are not yet supported.
6. During AI Agent operations, please avoid interacting with the UI to prevent confusion.

# 2026.5.13
## Loongbones Updated to Version 1.1.10
1. Fixed a bug where exporting DragonBones animation data failed.
2. Fixed a bug where exporting some Spine format data was incorrect.

# 2026.5.7
## Loongbones Updated to Version 1.1.9
1. In the Outline panel, bones and slots can now be renamed by double-clicking.
2. Fixed a bug where bone scaling to 0 caused issues.
3. Fixed a bug where transformation constraints were sometimes incorrect.
4. Fixed a bug where exporting animation was abnormal when the slot animation had no keyframe on the first frame.
5. Fixed a bug where importing Spine data could potentially cause errors.

# 2026.5.1
## Loongbones Updated to Version 1.1.8
1. Added the ability to publish as a Digital Human in the editor.
2. Added a Digital Human page on the home page, where Digital Humans can be edited and published.
3. Published Digital Humans can converse with users.

# 2026.1.5
## Loongbones updated to Version 1.1.5
1. Added copy, paste and clone functions for bones and slots in the property panel

2. Added mesh rendering order editing functionality

3. Fixed a bug where double-clicking on the stage would cause accidental marquee selection

4. Fixed a bug where copy-paste shortcuts would not work when focus was on the outline panel

# 2025.12.28
## Loongbones Updated to Version 1.1.4
1. Support for different skeletons using different frame rates.
2. Optimized export prompts.
3. Added bone selection in the IK constraints and transformation constraints panels within the Bone Properties.
4. Pressing ESC or double-clicking on the stage now deselects objects.
5. Fixed a bug where physics simulation was incorrect when the frame rate was not 30 FPS.
6. Fixed a bug where the total keyframe indicator (diamond) showed all frames after selecting a bone.
7. Fixed the transformation constraint offset issue to align with Spine's behavior.

# 2025.11.16
## Loongbones Updated to Version 1.1.3
1. Fixed a bug related to automatic outline generation.
2. Fixed a bug where the snap range was too large after zooming in the mesh editing interface.
3. Fixed a bug where modifying UV points of a mesh could cause custom outlines to intersect.
4. Fixed a bug where moving frames could cause overlap and potentially delete the recently moved frame.
5. Fixed a bug where renaming sometimes selected the entire name, leading to input lag.
6. Optimized stage preview performance when there are many keyframes.
7. Added coordinate display for multiple selected bones and the ability to add keyframes in animation mode.
8. Added the ability to modify the length of multiple selected bones.
9. Added a delete skeleton button to the Library panel.
10. Added a delete button to the Outline panel.
11. Added a preheating function to physics baking.

# 2025.11.3
## Loongbones Updated to Version 1.1.2
1. Added physics baking functionality.

# 2025.10.20
## Loongbones Updated to Version 1.1.1
1. Added timeline offset functionality for loops.
2. Added functionality to move frames backward.
3. Fixed bugs related to Spine data import: lost rotation data, deformed mesh animations, and non-functional transformation constraints.

# 2025.09.30
## Loongbones Updated to Version 1.1.0
1. Added GIF export format.
2. Added video export format. The first video export will load the video encoder (a large file, please wait patiently).
3. Added a public library feature. Users can publish their works to the public library, and others can purchase them. Specific revenue-sharing policies will be announced later.

# 2025.09.21
## Loongbones Updated to Version 1.0.23
1. Added sound import, sound event keyframe addition, and preview.
2. Added lasso selection to mesh editing (hold Alt key to lasso select).
3. Added brush functionality for soft selection of mesh points and weight painting.

# 2025.9.9
## Loongbones Updated to Version 1.0.22
1. Fixed a bug where physics constraint calculations were incorrect for horizontal bones.

# 2025.9.8
## Loongbones Updated to Version 1.0.21
1. Fixed a bug where exporting Spine data could cause some meshes to display incorrectly.
2. Fixed a bug where exporting Spine data could cause some attachments to lose width data.

# 2025.7.29
## Loongbones Updated to Version 1.0.20
1. Exporting images can now be packaged into a ZIP file.
2. Fixed an angle display bug for parent-child bones in IK constraints.
3. Added canvas display.
4. Added the option to select canvas size when exporting image sequences.
5. Added multi-frame editing functionality.
6. Fixed a bug where onion skinning could cause errors without slots.
7. Fixed other bugs.

# 2025.7.4
## Loongbones Updated to Version 1.0.18
1. Fixed a bug with the animation proxy timeline background color.
2. Fixed a bug where deleting a slot did not delete its FFD animation data.
3. Fixed a bug where deleting a slot did not delete its z-order frame data.
4. When simultaneously transforming a slot and a bone, if the slot has skinning, only the bone transforms.
5. Shape skinning can now revert to the bone's initial state.
6. Added upward masking functionality to masks; default changed from upward to downward masking.
7. Fixed bugs related to exporting Spine format.
8. Added `_ske` suffix to exported DragonBones JSON data files.

# 2025.6.23
## Loongbones Updated to Version 1.0.17
1. Added animation proxy functionality.
    * Animation proxy enables blending of multiple animations.
    * Animation proxy achieves animation slider effects similar to Spine 4.3.

# 2025.6.16
## Loongbones Updated to Version 1.0.16
1. Fixed a bug where adding assets could not be undone.
2. Fixed a bug where deleting mesh points and then undoing could cause errors.
3. Fixed a bug where creating a bone and then undoing with the mouse over the bone could cause errors.
4. Fixed a bug where adding a nested animation and then deleting a slot could cause errors.
5. Fixed a bug where display object names could not be modified.
6. Fixed a bug where the last line of the skeleton tree in the Outline panel was not displayed.
7. Added support for applying physics to multiple selected bones simultaneously.
8. Added support for cross-project copy-paste of bones, slots, and display objects.

# 2025.5.31
## Loongbones Updated to Version 1.0.14
1. Fixed a bug where the pose tool could cause errors when selecting slots.
2. Fixed a bug where deleting a bone from a path constraint could cause errors.
3. Fixed a bug where selecting slots in the hierarchy panel could cause errors.
4. Fixed a bug where changing bone color did not work.
5. Fixed a bug where selecting bones in the outline with Shift key might not work correctly.
6. Fixed a bug where creating bones failed when bones were locked.
7. Fixed a bug where selecting mesh points and then switching tools prevented bone selection.
8. Fixed a bug with percentage input.
9. Added pre-made skeleton templates.
10. Added automatic bone and slot matching functionality.
11. Added bone splitting functionality.
12. Transformation constraint weights now support negative values.

# 2025.5.13
## Loongbones Updated to Version 1.0.13
1. Fixed a bug where selecting mesh points and then switching tools prevented bone selection.
2. Fixed a bug with percentage input.
3. Transformation constraint weights now support negative values.

# 2025.5.12
## Loongbones Updated to Version 1.0.12
1. Fixed a bug where some `.dbbin` files failed to import.
2. Fixed a bug where default animations did not work.
3. Fixed a bug where switching selected objects during bone binding could cause errors.
4. Fixed a bug where modifying hierarchy could sometimes not be undone.
5. Fixed a bug where imported event time frames were parsed incorrectly.
6. Fixed a bug where exporting shape animation data could sometimes be incorrect.
7. Added support for importing texture data from Spine 4.2 format.
8. Added support for importing physics constraints from Spine 4.2 format.
9. Fixed bugs related to exporting Spine 4.2 format data.
10. Fixed a bug where deleting a slot could delete other FFD deformation animations.
11. Fixed a bug where setting current offset in transformation constraints did not take effect.
12. Fixed a calculation error for Y-axis translation constraints in physics constraints.
13. Fixed a bug where undo/redo could fail.
14. In the Outline panel, holding Ctrl and clicking show/hide or lock buttons now toggles selection.
15. Added keyboard shortcuts:
    Animation Mode:
        Space: Play/Pause animation
        L: Toggle loop playback
        Left/Right Arrow: Previous frame / Next frame
        Page Up / Page Down: First frame / Last frame
    Skeleton Mode:
        Arrow Keys: Nudge selected object
        V: Switch to Selection Tool
        B: Switch to Bone Creation Tool
        N: Switch to Pose Tool
        W: Switch to Weight Tool

# 2025.5.4
## Loongbones Updated to Version 1.0.11
1. Fixed a bug where some `.dbbin` files failed to import.
2. Fixed a bug where default animations did not work.
3. Fixed a bug where switching selected objects during bone binding could cause errors.
4. Fixed a bug where modifying hierarchy could sometimes not be undone.
5. Fixed a bug where imported event time frames were parsed incorrectly.
6. Fixed a bug where exporting shape animation data could sometimes be incorrect.
7. Added support for importing texture data from Spine 4.2 format.
8. Added support for importing physics constraints from Spine 4.2 format.
9. Fixed bugs related to exporting Spine 4.2 format data.

# 2025.4.30
## Loongbones Updated to Version 1.0.10
1. Fixed a bug where some `.dbbin` files could not be imported.
2. Fixed a bug that could cause selection functionality to fail under certain conditions.

# 2025.4.25
## Loongbones Updated to Version 1.0.9
1. Fixed a bug in animation mode where the slot visibility toggle in the Outline panel failed.
2. Added support for importing `.dbbin` files by dragging them and their texture atlas files into the asset library.

# 2025.4.15
## Loongbones Updated to Version 1.0.8
1. Fixed a bug where imported Spine transformation constraint data was incorrect.
2. Fixed a bug where importing Spine meshes without width/height attributes could cause errors.
3. Fixed a bug where deleting rigged mesh points could cause weight confusion.
4. Fixed a bug where switching skeletons could disable physics simulation.
5. The current skeleton is now highlighted in the Library.
6. Added support for cross-project copy-paste of skeleton and animation data.

# 2025.4.7
## Loongbones Updated to Version 1.0.7
1. Fixed a bug where importing `.dbpro` files could cause missing images.

# 2025.4.7
## Loongbones Updated to Version 1.0.6
1. Added rename and delete functionality for the resource library.

# 2025.4.2
## Loongbones Updated to Version 1.0.5
1. Fixed a bug where imported skeleton data showed missing images.
2. Fixed a path export length calculation error.
3. Updated to the new UI version.
4. Added percentage mode for spacing in path constraints.

# 2025.3.24
## Loongbones Updated to Version 1.0.4
1. Fixed various bugs.
2. Added a "Follow" mode to path constraint rotation rules.
3. Added wind disturbance to physics constraints.
4. Added bone binding mode for shapes and paths, allowing them to bind to bones and modify weights like meshes.
5. Added anti-aliasing effect.

# 2025.3.16
## Loongbones Updated to Version 1.0.3
1. Fixed a bug where creating an IK constraint and then undoing could cause errors.
2. Fixed a bug with bone visibility toggling.
3. Fixed a bug in animation mode where path deformation for path constraints did not update.
4. Fixed a scaling bug for path constraints.
5. Fixed bugs related to gravity and wind force in physics.
6. Added swipe actions for lock and hide buttons in the Outline.
7. Added functionality to add and edit event keyframes.

# 2025.3.10
## Loongbones Updated to Version 1.0.2
1. Fixed a bug where creating mesh points could sometimes cause the software to hang.
2. Fixed a bug where decimal values could not be entered in the properties panel.
3. Reduced the size of the transformation handles.
4. Runtime updated to 6.0.2, supporting Pixi 7 engine.
5. Preview now supports transformation constraints, path constraints, physics constraints, shape drawing, and masking.

# 2025.3.6
## Loongbones Updated to Version 1.0.1
1. Fixed a bug where deleting a slot or bone sometimes did not delete associated path constraints.
2. Fixed a bug where path constraint animation keyframes could not be deleted.
3. Fixed a bug where importing 16-bit depth PSD files caused errors without proper prompts.
4. Fixed a bug where importing PSD files with duplicate names could overwrite each other.

# 2025.3.2
## Loongbones Updated to Version 1.0.0
1. The new version of Loongbones is launched, supporting all features of the original DragonBones Pro.
2. Supports physics constraints.
3. Website: https://www.loongbones.app