import os
from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Register JavaScript extensions - matching Impact Pack's approach
import nodes
nodes.EXTENSION_WEB_DIRS["ComfyUI-HQ-Image-Save-Download"] = os.path.join(os.path.dirname(os.path.realpath(__file__)), "js")

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']