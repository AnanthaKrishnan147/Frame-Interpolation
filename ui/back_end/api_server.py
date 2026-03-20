import sys
import os
import shutil
import cv2
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Ensure the back_end directory is in the path so we can import the pipeline
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from frame_interpolation_pipeline import generate_intermediate_frame

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/interpolate")
async def interpolate_frames(
    frameA: UploadFile = File(...), 
    frameB: UploadFile = File(...),
    targetFps: int = Form(24)
):
    # Save the uploaded files temporarily
    path_a = os.path.join(TEMP_DIR, frameA.filename)
    path_b = os.path.join(TEMP_DIR, frameB.filename)

    with open(path_a, "wb") as buffer:
        shutil.copyfileobj(frameA.file, buffer)
    with open(path_b, "wb") as buffer:
        shutil.copyfileobj(frameB.file, buffer)

    # Call the logic
    # Default original FPS is usually 12 in the frontend (though user might set to 24)
    # Based on prompt, if fps=24, generate frames. Assuming `num_frames_to_generate` = targetFps / 12 - 1 roughly.
    # But since prompt said `fps=2 -> 1, fps=4 -> 3`, we can just pass the targetFps down.
    # The pipeline now treats it as generate `targetFps - 1` frames, or `fps` frames.
    # To keep it simple, we pass it down.
    from frame_interpolation_pipeline import generate_intermediate_frame
    
    # We renamed generate_intermediate_frame to return a list
    result_images = generate_intermediate_frame(path_a, path_b, fps=targetFps)
    
    if not result_images:
        return {"error": "Failed to generate intermediate frames."}

    import zipfile
    
    zip_path = os.path.join(TEMP_DIR, "output.zip")
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for i, img in enumerate(result_images):
            img_filename = f"frame_{i:03d}.png"
            img_path = os.path.join(TEMP_DIR, img_filename)
            cv2.imwrite(img_path, img)
            zipf.write(img_path, arcname=img_filename)

    # Return the generated zip
    return FileResponse(zip_path, media_type="application/zip")

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=5000, reload=True, reload_dirs=[os.path.dirname(os.path.abspath(__file__))])
