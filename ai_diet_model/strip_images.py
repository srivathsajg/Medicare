import re

def strip_images(file_path, output_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace anything starting with https://images.unsplash.com or https://image.pollinations.ai 
    # inside a string assigned to 'image' or "image"
    content = re.sub(r'["\']image["\']:\s*["\']https://images\.unsplash\.com/[^"\']*["\']', '"image": ""', content)
    content = re.sub(r'["\']image["\']:\s*["\']https://image\.pollinations\.ai/[^"\']*["\']', '"image": ""', content)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    strip_images('diet_data.py', 'diet_data_fixed.py')
