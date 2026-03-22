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
    frameB: UploadFile = File(...)
):
    # Save the uploaded files temporarily
    path_a = os.path.join(TEMP_DIR, frameA.filename)
    path_b = os.path.join(TEMP_DIR, frameB.filename)

    with open(path_a, "wb") as buffer:
        shutil.copyfileobj(frameA.file, buffer)
    with open(path_b, "wb") as buffer:
        shutil.copyfileobj(frameB.file, buffer)

    from frame_interpolation_pipeline import generate_intermediate_frame
    
    # Generate the single intermediate frame
    result_img = generate_intermediate_frame(path_a, path_b)
    
    if result_img is None:
        return {"error": "Failed to generate intermediate frame."}

    # Save and return as a single PNG
    output_path = os.path.join(TEMP_DIR, "output.png")
    cv2.imwrite(output_path, result_img)

    return FileResponse(output_path, media_type="image/png")

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=5000, reload=True, reload_dirs=[os.path.dirname(os.path.abspath(__file__))])
