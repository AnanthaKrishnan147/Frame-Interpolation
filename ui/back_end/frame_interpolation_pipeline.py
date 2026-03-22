import os
import cv2
import math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm
import argparse

# --- Configuration ---
class Config:
    VIDEO_PATH = 'raw_videos/my_animation.mp4'
    DATASET_DIR = 'dataset'
    TRIPLETS_DIR = os.path.join(DATASET_DIR, 'triplets')
    EDGES_DIR = os.path.join(DATASET_DIR, 'edges')
    FLOW_DIR = os.path.join(DATASET_DIR, 'flow')
    WARPED_DIR = os.path.join(DATASET_DIR, 'warped')
    
    SCENE_THRESHOLD = 30.0
    EDGE_LOWER_THRESH = 100
    EDGE_UPPER_THRESH = 200
    
    BATCH_SIZE = 4
    LEARNING_RATE = 0.001
    EPOCHS = 20
    IMG_SIZE = 256
    # MODEL_PATH = "fusion_model.pth"  # Removed as user will provide their own model
    
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- Model Definition ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "fusion_model.pth")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class FusionNet(nn.Module):
    def __init__(self):
        super(FusionNet, self).__init__()
        self.enc1 = nn.Sequential(nn.Conv2d(6, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(inplace=True))
        self.enc2 = nn.Sequential(nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True))
        self.enc3 = nn.Sequential(nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True))
        self.bottle = nn.Sequential(nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True))
        self.up3 = nn.ConvTranspose2d(128, 64, 4, stride=2, padding=1)
        self.dec3 = nn.Sequential(nn.Conv2d(128, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True))
        self.up2 = nn.ConvTranspose2d(64, 32, 4, stride=2, padding=1)
        self.dec2 = nn.Sequential(nn.Conv2d(64, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(inplace=True))
        self.final = nn.Conv2d(32, 3, 3, padding=1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(F.max_pool2d(e1, 2))
        e3 = self.enc3(F.max_pool2d(e2, 2))
        b = self.bottle(e3)
        d3 = self.up3(b)
        d3 = torch.cat([d3, e2], dim=1)
        d3 = self.dec3(d3)
        d2 = self.up2(d3)
        d2 = torch.cat([d2, e1], dim=1)
        d2 = self.dec2(d2)
        out = self.final(d2)
        return torch.sigmoid(out)

model = FusionNet().to(device)
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()
print("Model Loaded Successfully")

# --- Dataset Processing ---
def create_triplets(video_path, output_dir, scene_threshold=30.0):
    """01_Data_Collection.ipynb"""
    if not os.path.exists(video_path):
        print(f"❌ Error: Video not found at {video_path}")
        return
        
    cap = cv2.VideoCapture(video_path)
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    save_path = os.path.join(output_dir, video_name)
    os.makedirs(save_path, exist_ok=True)

    ret1, prev = cap.read()
    ret2, curr = cap.read()
    if not ret1 or not ret2:
        print("❌ Error reading video frames.")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    saved_count = 0
    print(f"🎬 Processing {video_name}...")

    for _ in tqdm(range(total_frames - 2), desc="Extracting Triplets"):
        ret3, next_frame = cap.read()
        if not ret3: break

        diff1 = np.mean(np.abs(prev.astype(float) - curr.astype(float)))
        diff2 = np.mean(np.abs(curr.astype(float) - next_frame.astype(float)))

        if diff1 < scene_threshold and diff2 < scene_threshold:
            uid = f"{saved_count:05d}"
            cv2.imwrite(os.path.join(save_path, f"{uid}_0.png"), prev)
            cv2.imwrite(os.path.join(save_path, f"{uid}_1.png"), curr)
            cv2.imwrite(os.path.join(save_path, f"{uid}_2.png"), next_frame)
            saved_count += 1
        
        prev = curr
        curr = next_frame

    cap.release()
    print(f"✅ Saved {saved_count} triplets to {save_path}")

# --- Edge Detection ---
def extract_edges_from_triplets(input_dir, output_dir, lower=100, upper=200):
    """02_Edge_Detection.ipynb"""
    os.makedirs(output_dir, exist_ok=True)
    all_image_paths = []

    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                all_image_paths.append(os.path.join(root, file))

    if not all_image_paths:
        print(f"⚠️ No images found in '{input_dir}' for edge detection.")
        return

    print(f"🔍 Extracting edges for {len(all_image_paths)} images...")
    for img_path in tqdm(all_image_paths, desc="Edge Detection"):
        frame = cv2.imread(img_path)
        if frame is None: continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, lower, upper)
        
        rel_path = os.path.relpath(img_path, input_dir)
        save_path = os.path.join(output_dir, rel_path)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        cv2.imwrite(save_path, edges)
    print("✅ Edge detection complete.")

# --- Motion Estimation ---
def compute_optical_flow(input_dir, output_dir):
    """03_Motion_Estimation.ipynb"""
    os.makedirs(output_dir, exist_ok=True)
    pairs = []

    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.endswith('_0.png'):
                start_path = os.path.join(root, file)
                end_path = start_path.replace('_0.png', '_2.png')
                if os.path.exists(end_path):
                    pairs.append((start_path, end_path))

    if not pairs:
        print(f"⚠️ No triplet pairs found in '{input_dir}' for motion estimation.")
        return

    print(f"🔄 Computing optical flow for {len(pairs)} pairs...")
    for start_p, end_p in tqdm(pairs, desc="Motion Estimation"):
        prev_img = cv2.imread(start_p)
        next_img = cv2.imread(end_p)
        if prev_img is None or next_img is None: continue

        prev_gray = cv2.cvtColor(prev_img, cv2.COLOR_BGR2GRAY)
        next_gray = cv2.cvtColor(next_img, cv2.COLOR_BGR2GRAY)
        
        flow = cv2.calcOpticalFlowFarneback(prev_gray, next_gray, None, 
                                            0.5, 3, 15, 3, 5, 1.2, 0)
        
        rel_path = os.path.relpath(start_p, input_dir)
        save_path = os.path.join(output_dir, rel_path.replace('.png', '.npy'))
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        np.save(save_path, flow)
    print("✅ Motion estimation complete.")

# --- Frame Warping ---
def warp_tensor(img_tensor, flow_tensor, device):
    """04_Warping.ipynb - Core warping function"""
    N, C, H, W = img_tensor.shape
    xx = torch.arange(0, W).view(1, -1).repeat(H, 1)
    yy = torch.arange(0, H).view(-1, 1).repeat(1, W)
    xx = xx.view(1, 1, H, W).repeat(N, 1, 1, 1)
    yy = yy.view(1, 1, H, W).repeat(N, 1, 1, 1)
    
    grid = torch.cat((xx, yy), 1).float()
    if img_tensor.device.type != 'cpu':
        grid = grid.to(device)
        
    vgrid = grid + flow_tensor
    vgrid[:, 0, :, :] = 2.0 * vgrid[:, 0, :, :] / max(W - 1, 1) - 1.0
    vgrid[:, 1, :, :] = 2.0 * vgrid[:, 1, :, :] / max(H - 1, 1) - 1.0
    vgrid = vgrid.permute(0, 2, 3, 1)
    
    return F.grid_sample(img_tensor, vgrid, align_corners=True, padding_mode='border')

def generate_warped_dataset(img_dir, flow_dir, output_dir, device):
    os.makedirs(output_dir, exist_ok=True)
    flow_files = []
    
    for root, dirs, files in os.walk(flow_dir):
        for file in files:
            if file.endswith('.npy'):
                flow_files.append(os.path.join(root, file))

    if not flow_files:
        print(f"⚠️ No flow files found in '{flow_dir}' for warping.")
        return

    print(f"🌌 Warping {len(flow_files)} frames...")
    for flow_path in tqdm(flow_files, desc="Frame Warping"):
        flow_data = np.load(flow_path)
        rel_path = os.path.relpath(flow_path, flow_dir)
        img_path = os.path.join(img_dir, rel_path.replace('.npy', '.png'))
        
        if not os.path.exists(img_path): continue
        img_bgr = cv2.imread(img_path)
        if img_bgr is None: continue

        img_tensor = torch.from_numpy(img_bgr).permute(2, 0, 1).unsqueeze(0).float()
        flow_tensor = torch.from_numpy(flow_data).permute(2, 0, 1).unsqueeze(0).float()

        with torch.no_grad():
            warped_tensor = warp_tensor(img_tensor, flow_tensor * 0.5, device)
        
        warped_img = warped_tensor.squeeze(0).permute(1, 2, 0).numpy().astype(np.uint8)
        save_path = os.path.join(output_dir, rel_path.replace('.npy', '_warp.png'))
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        cv2.imwrite(save_path, warped_img)
    print("✅ Frame warping dataset generated.")

def generate_intermediate_frame(frameA_path, frameB_path):
    print("Model Loaded")
    print("Running Inference")
    
    imgA = cv2.imread(frameA_path)
    imgB = cv2.imread(frameB_path)
    
    if imgA is None or imgB is None:
        print("❌ Error: Images could not be read. Please check paths.")
        return None

    # Save original shape for restoration
    orig_shape = (imgA.shape[1], imgA.shape[0])
    
    # Resize to 256x256
    imgA_resized = cv2.resize(imgA, (256, 256))
    imgB_resized = cv2.resize(imgB, (256, 256))
    
    # Normalize to [0,1] and convert to tensor shape (1, 3, H, W)
    tensorA = torch.from_numpy(imgA_resized).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    tensorB = torch.from_numpy(imgB_resized).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    tensorA = tensorA.to(device)
    tensorB = tensorB.to(device)
    
    # Compute Farneback optical flow
    grayA = cv2.cvtColor(imgA_resized, cv2.COLOR_BGR2GRAY)
    grayB = cv2.cvtColor(imgB_resized, cv2.COLOR_BGR2GRAY)
    flow_fwd = cv2.calcOpticalFlowFarneback(grayA, grayB, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    flow_bwd = cv2.calcOpticalFlowFarneback(grayB, grayA, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    
    flow_fwd_tensor = torch.from_numpy(flow_fwd).permute(2, 0, 1).unsqueeze(0).float().to(device)
    flow_bwd_tensor = torch.from_numpy(flow_bwd).permute(2, 0, 1).unsqueeze(0).float().to(device)
    
    with torch.no_grad():
        # Warp both frames (at t=0.5)
        warpedA = warp_tensor(tensorA, flow_fwd_tensor * 0.5, device)
        warpedB = warp_tensor(tensorB, flow_bwd_tensor * 0.5, device)
        
        # Concatenate -> (1, 6, H, W)
        input_tensor = torch.cat([warpedA, warpedB], dim=1)
        
        # Pass to model
        output_tensor = model(input_tensor)
        
    print("Output Generated")
    
    # Output tensor to numpy
    out_np = output_tensor.squeeze(0).permute(1, 2, 0).cpu().numpy()
    
    # Multiply by 255 and convert to uint8
    out_img = (out_np * 255.0).clip(0, 255).astype(np.uint8)
    
    # Restore original dimensions
    out_img = cv2.resize(out_img, orig_shape)
    
    # 4. Ensure image is NOT blank
    if np.sum(out_img) == 0 or np.mean(out_img) < 1.0:
        # Fallback to simple blending if model returns blank
        print("⚠️ Warning: Output was blank, falling back to simple blend.")
        out_img = cv2.addWeighted(imgA, 0.5, imgB, 0.5, 0)

    return out_img

def run_inference(config, frame_a_path, frame_b_path, output_path):
    """06_generate_CUDA.ipynb - Single Frame Interpolation"""
    print(f"🚀 Generator hardware: {config.DEVICE}")
    # model = AdvancedFusionNet().to(config.DEVICE) # Removed
    
    if not os.path.exists(frame_a_path) or not os.path.exists(frame_b_path):
        print("❌ Error: Could not find one or both of your input files.")
        return

    print("⏳ Generating single middle frame using FusionNet...")
    middle_gen = generate_intermediate_frame(frame_a_path, frame_b_path)
    if middle_gen is None:
        return
    
    if os.path.dirname(output_path):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, middle_gen)
    print(f"✅ Success! Saved to: '{output_path}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Frame Interpolation Pipeline")
    parser.add_argument('--collect', action='store_true', help="Run data collection")
    parser.add_argument('--edges', action='store_true', help="Run edge detection")
    parser.add_argument('--flow', action='store_true', help="Run motion estimation")
    parser.add_argument('--warp', action='store_true', help="Generate warped dataset")
    parser.add_argument('--train', action='store_true', help="Train the model")
    parser.add_argument('--inference', action='store_true', help="Run inference on two frames")
    parser.add_argument('--frame_a', type=str, help="First frame for inference")
    parser.add_argument('--frame_b', type=str, help="Second frame for inference")
    parser.add_argument('--output', type=str, default='output.png', help="Output path for inference result")
    parser.add_argument('--all', action='store_true', help="Run all pipeline steps sequentially")
    
    args = parser.parse_args()
    config = Config()

    if args.all:
        print("--- Running Full Pipeline ---")
        create_triplets(config.VIDEO_PATH, config.TRIPLETS_DIR, config.SCENE_THRESHOLD)
        extract_edges_from_triplets(config.TRIPLETS_DIR, config.EDGES_DIR, config.EDGE_LOWER_THRESH, config.EDGE_UPPER_THRESH)
        compute_optical_flow(config.TRIPLETS_DIR, config.FLOW_DIR)
        generate_warped_dataset(config.TRIPLETS_DIR, config.FLOW_DIR, config.WARPED_DIR, config.DEVICE)
        # train_model(config) # Removed
    else:
        has_run = False
        if args.collect:
            create_triplets(config.VIDEO_PATH, config.TRIPLETS_DIR, config.SCENE_THRESHOLD)
            has_run = True
        if args.edges:
            extract_edges_from_triplets(config.TRIPLETS_DIR, config.EDGES_DIR, config.EDGE_LOWER_THRESH, config.EDGE_UPPER_THRESH)
            has_run = True
        if args.flow:
            compute_optical_flow(config.TRIPLETS_DIR, config.FLOW_DIR)
            has_run = True
        if args.warp:
            generate_warped_dataset(config.TRIPLETS_DIR, config.FLOW_DIR, config.WARPED_DIR, config.DEVICE)
            has_run = True
        if args.train:
            print("⚠️ Training code has been removed to allow for custom model integration.")
            has_run = True
        if args.inference:
            if not args.frame_a or not args.frame_b:
                print("❌ Please provide --frame_a and --frame_b for inference")
            else:
                run_inference(config, args.frame_a, args.frame_b, args.output)
            has_run = True
                
        if not has_run:
            print("Please specify a command-line flag.")
            parser.print_help()
