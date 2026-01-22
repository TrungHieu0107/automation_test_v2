from PIL import Image
import sys

def merge_images(main_path, child_path, output_path="merged_output.png"):
    """
    Merge two PNG images with their centers aligned.
    
    Args:
        main_path: Path to the main (background) image
        child_path: Path to the child (overlay) image
        output_path: Path for the output merged image (default: merged_output.png)
    """
    try:
        # Open both images
        main_img = Image.open(main_path).convert("RGBA")
        child_img = Image.open(child_path).convert("RGBA")
        
        # Get dimensions
        main_w, main_h = main_img.size
        child_w, child_h = child_img.size
        
        # Calculate position to center child image on main image
        x = (main_w - child_w) // 2
        y = (main_h - child_h) // 2
        
        # Create a copy of main image to preserve original
        result = main_img.copy()
        
        # Paste child image onto main image at calculated position
        # The child_img is used as mask to preserve transparency
        result.paste(child_img, (x, y), child_img)
        
        # Save the result
        result.save(output_path)
        print(f"✓ Images merged successfully! Saved to: {output_path}")
        print(f"  Main image: {main_w}x{main_h}")
        print(f"  Child image: {child_w}x{child_h}")
        print(f"  Child position: ({x}, {y})")
        
    except FileNotFoundError as e:
        print(f"✗ Error: Could not find image file - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python merge_images.py <main_image_path> <child_image_path> [output_path]")
        print("Example: python merge_images.py background.png logo.png result.png")
        sys.exit(1)
    
    main_path = sys.argv[1]
    child_path = sys.argv[2]
    output_path = sys.argv[3] if len(sys.argv) > 3 else "merged_output.png"
    
    merge_images(main_path, child_path, output_path)