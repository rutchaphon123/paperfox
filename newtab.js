document.addEventListener("DOMContentLoaded", () => {
    const storage = typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;

    const wallpaperDiv = document.getElementById("wallpaper");
    const uploadInput = document.getElementById("uploadWallpaper");
    const chooseColorButton = document.getElementById("chooseColor");
    const gearButton = document.getElementById("gear-button");
    const gearIcon = document.getElementById("gear-icon"); // ไอคอนฟันเฟือง
    const settingsSidebar = document.getElementById("settings-sidebar");
    const closeSidebarButton = document.getElementById("close-sidebar");
    const historyDiv = document.getElementById("history");
    const defaultThemeDiv = document.getElementById("default-theme");

    // สร้างองค์ประกอบสำหรับ Image Cropper แบบกำหนดเอง
    const cropperContainer = document.createElement("div");
    cropperContainer.id = "cropper-container";
    cropperContainer.classList.add("hidden");
    
    const cropperImageContainer = document.createElement("div");
    cropperImageContainer.id = "cropper-image-container";
    
    const cropperImage = document.createElement("img");
    cropperImage.id = "cropper-image";
    
    const cropperOverlay = document.createElement("div");
    cropperOverlay.id = "cropper-overlay";
    
    const cropperFrame = document.createElement("div");
    cropperFrame.id = "cropper-frame";
    
    // สร้างแฮนเดิลสำหรับย่อขยาย
    const corners = ["tl", "tr", "bl", "br"];
    corners.forEach(corner => {
        const handle = document.createElement("div");
        handle.className = `cropper-handle ${corner}-handle`;
        cropperFrame.appendChild(handle);
    });
    
    cropperOverlay.appendChild(cropperFrame);
    cropperImageContainer.appendChild(cropperImage);
    cropperImageContainer.appendChild(cropperOverlay);
    
    const cropperControls = document.createElement("div");
    cropperControls.id = "cropper-controls";
    
    const cropButton = document.createElement("button");
    cropButton.id = "crop-button";
    cropButton.className = "button-style";
    cropButton.innerText = "✂️ ครอปและบันทึก";
    
    const cancelCropButton = document.createElement("button");
    cancelCropButton.id = "cancel-crop";
    cancelCropButton.className = "button-style";
    cancelCropButton.innerText = "❌ ยกเลิก";
    
    // สร้างตัวควบคุมสัดส่วนภาพ
    const ratioControl = document.createElement("div");
    ratioControl.id = "ratio-controls";
    
    const ratioFreeButton = document.createElement("button");
    ratioFreeButton.className = "ratio-button active";
    ratioFreeButton.innerText = "อิสระ";
    ratioFreeButton.dataset.ratio = "free";
    
    const ratioLandscapeButton = document.createElement("button");
    ratioLandscapeButton.className = "ratio-button";
    ratioLandscapeButton.innerText = "16:9";
    ratioLandscapeButton.dataset.ratio = "16:9";
    
    const ratioPortraitButton = document.createElement("button");
    ratioPortraitButton.className = "ratio-button";
    ratioPortraitButton.innerText = "9:16";
    ratioPortraitButton.dataset.ratio = "9:16";
    
    const ratioSquareButton = document.createElement("button");
    ratioSquareButton.className = "ratio-button";
    ratioSquareButton.innerText = "1:1";
    ratioSquareButton.dataset.ratio = "1:1";
    
    // จัดเรียงองค์ประกอบ
    ratioControl.appendChild(ratioFreeButton);
    ratioControl.appendChild(ratioLandscapeButton);
    ratioControl.appendChild(ratioPortraitButton);
    ratioControl.appendChild(ratioSquareButton);
    
    cropperControls.appendChild(ratioControl);
    cropperControls.appendChild(cropButton);
    cropperControls.appendChild(cancelCropButton);
    
    cropperContainer.appendChild(cropperImageContainer);
    cropperContainer.appendChild(cropperControls);
    
    document.body.appendChild(cropperContainer);
    // สร้างตัวเลือกรูปแบบการแสดงภาพพื้นหลัง
    const bgFitLabel = document.createElement("h4");
    bgFitLabel.textContent = "รูปแบบการแสดงพื้นหลัง";
    
    const bgFitContainer = document.createElement("div");
    bgFitContainer.className = "bg-fit-container";

    // สร้างตัวเลือก
    const fitOptions = [
        { id: "cover", text: "เต็มจอ", desc: "ขยายเต็มพื้นที่ แต่อาจตัดบางส่วน" },
        { id: "contain", text: "เต็มภาพ", desc: "แสดงภาพทั้งหมด แต่อาจมีพื้นที่ว่าง" },
        { id: "custom", text: "กำหนดเอง", desc: "ตำแหน่งและขนาดตามที่ต้องการ" }
    ];

    fitOptions.forEach(option => {
        const optionElement = document.createElement("div");
        optionElement.className = `bg-fit-option ${option.id}`;
        optionElement.dataset.fit = option.id;
        
        const optionTitle = document.createElement("div");
        optionTitle.className = "option-title";
        optionTitle.textContent = option.text;
        
        const optionDesc = document.createElement("div");
        optionDesc.className = "option-desc";
        optionDesc.textContent = option.desc;
        
        optionElement.appendChild(optionTitle);
        optionElement.appendChild(optionDesc);
        
        bgFitContainer.appendChild(optionElement);
        
        // เพิ่ม event listener
        optionElement.addEventListener("click", () => {
            // ลบ class active จากทุกตัวเลือก
            document.querySelectorAll(".bg-fit-option").forEach(el => {
                el.classList.remove("active");
            });
            
            // เพิ่ม class active ให้ตัวเลือกที่ถูกเลือก
            optionElement.classList.add("active");
            
            // กำหนดรูปแบบการแสดงภาพพื้นหลัง
            const fitType = option.id;
            applyBackgroundFit(fitType);
            
            // บันทึกค่าลงใน storage
            storage.get(["wallpaper", "bgFit"]).then(data => {
                storage.set({ wallpaper: data.wallpaper, bgFit: fitType });
            });
        });
    });

    // เพิ่มเข้าไปใน settingsSidebar
    // แก้ไขการเพิ่มตัวเลือกรูปแบบการแสดงภาพพื้นหลังลงใน Sidebar
    // แทนที่จะใช้ insertBefore ที่อาจจะติดปัญหาโครงสร้าง DOM ที่เปลี่ยนไป
    // เปลี่ยนเป็นการเพิ่มลงไปก่อนส่วนประวัติ Wallpaper โดยตรง

    // หาตำแหน่งที่จะใส่ (หัวข้อประวัติ Wallpaper)
    const historyHeading = Array.from(settingsSidebar.querySelectorAll('h4')).find(
        heading => heading.textContent === "ประวัติ Wallpaper"
    );

    // ถ้าพบหัวข้อประวัติ Wallpaper
    if (historyHeading) {
        // แทรกก่อนหัวข้อประวัติ Wallpaper
        settingsSidebar.insertBefore(bgFitContainer, historyHeading);
        settingsSidebar.insertBefore(bgFitLabel, bgFitContainer);
    } else {
        // ถ้าไม่พบ ให้เพิ่มต่อจากส่วนของ Default Theme
        const defaultThemeHeading = Array.from(settingsSidebar.querySelectorAll('h4')).find(
            heading => heading.textContent === "Default Theme"
        );
        
        if (defaultThemeHeading && defaultThemeDiv) {
            // แทรกหลัง Default Theme
            settingsSidebar.insertBefore(bgFitLabel, defaultThemeDiv.nextSibling);
            settingsSidebar.insertBefore(bgFitContainer, bgFitLabel.nextSibling);
        } else {
            // ถ้าไม่พบอีก ให้เพิ่มต่อท้าย
            settingsSidebar.appendChild(bgFitLabel);
            settingsSidebar.appendChild(bgFitContainer);
        }
}

    let sidebarOpen = false;
    let imageSrc = null; // เก็บ source ของรูปภาพ
    let originalImageSize = { width: 0, height: 0 }; // เก็บขนาดจริงของรูปภาพ
    let containerSize = { width: 0, height: 0 }; // ขนาดของ container
    let scale = 1; // อัตราส่วนการย่อ/ขยาย
    let framePosition = { x: 0, y: 0 }; // ตำแหน่งของ frame
    let frameSize = { width: 0, height: 0 }; // ขนาดของ frame
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let dragType = null; // 'move', 'resize-tl', 'resize-tr', etc.
    let selectedRatio = "free";

    // ฟังก์ชันหน่วงเวลาให้ Animation ทำงานพร้อมกัน
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ฟังก์ชันเปลี่ยนสีฟันเฟืองอัตโนมัติ
// ฟังก์ชันสลับสีฟันเฟืองพร้อมเพิ่มเงา
function toggleGearColor() {
    // ตรวจสอบสถานะปัจจุบัน
    const currentFilter = window.getComputedStyle(gearIcon).filter;
    
    // สลับระหว่างสีดำและสีขาว
    if (currentFilter === "invert(0)" || currentFilter === "none") {
        // เปลี่ยนเป็นสีขาว พร้อมเงา
        gearIcon.style.filter = "";
        gearIcon.classList.remove("gear-no-shadow");
        gearIcon.classList.add("gear-outline");
    } else {
        // เปลี่ยนเป็นสีดำ ไม่มีเงา
        gearIcon.style.filter = "";
        gearIcon.classList.remove("gear-outline");
        gearIcon.classList.add("gear-no-shadow");
    }
    
    // บันทึกสถานะลงใน storage
    storage.set({ 
        gearColor: gearIcon.className
    });
    
    // ป้องกันการเปิด/ปิด sidebar โดยไม่ได้ตั้งใจ
    return false;
}

// ฟังก์ชันเปลี่ยนสีฟันเฟืองอัตโนมัติที่ปรับปรุงใหม่
function updateGearContrast() {
    // ตรวจสอบว่าผู้ใช้เคยตั้งค่าเองหรือไม่
    storage.get("gearColor").then(data => {
        // ถ้าผู้ใช้ตั้งค่าเอง ให้ใช้ค่าที่บันทึกไว้
        if (data.gearColor) {
            // ล้างค่า filter เดิม
            gearIcon.style.filter = "";
            
            // ตั้งค่า class ใหม่
            gearIcon.className = data.gearColor;
            return;
        }
        
        // ถ้าไม่ได้ตั้งค่าเอง ให้ตรวจจับอัตโนมัติ
        checkBackgroundBrightness();
    });
}

// ฟังก์ชันตรวจจับความสว่างของพื้นหลัง
function checkBackgroundBrightness() {
    // ตรวจสอบว่ามี background-image หรือไม่
    const hasBgImage = wallpaperDiv.style.backgroundImage && 
                     wallpaperDiv.style.backgroundImage !== "none";
    
    if (hasBgImage) {
        // ค่าเริ่มต้นสำหรับรูปภาพ - ใช้สีขาวพร้อมเงา
        gearIcon.style.filter = "";
        gearIcon.classList.remove("gear-no-shadow");
        gearIcon.classList.add("gear-outline");
    } else {
        // กรณีเป็นสีพื้น
        const bgColor = window.getComputedStyle(wallpaperDiv).backgroundColor;
        
        // แปลงสีจาก RGB เป็นค่าเฉลี่ยของความสว่าง (Brightness)
        const rgb = bgColor.match(/\d+/g);
        if (rgb) {
            const brightness = (parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114);
            
            // ล้างค่า filter และ class เดิมก่อน
            gearIcon.style.filter = "";
            gearIcon.classList.remove("gear-outline", "gear-no-shadow");
            
            // ถ้าพื้นหลังสว่าง ให้ทำให้ฟันเฟืองเป็นสีดำ, ถ้าพื้นหลังมืดให้เป็นสีขาวพร้อมเงา
            if (brightness > 128) {
                gearIcon.classList.add("gear-no-shadow");
            } else {
                gearIcon.classList.add("gear-outline");
            }
        }
    }
}

// อัพเดท Event Listener ของปุ่มฟันเฟือง
// เพิ่ม Double Click เพื่อสลับสีฟันเฟือง
gearButton.addEventListener("dblclick", function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleGearColor();
    return false;
});

// โหลดสถานะสีฟันเฟืองจาก storage
storage.get("gearColor").then(data => {
    if (data.gearColor) {
        // ล้างค่า filter เดิม
        gearIcon.style.filter = "";
        
        // ตั้งค่า class ใหม่
        gearIcon.className = data.gearColor;
    } else {
        // ถ้าไม่เคยตั้งค่าเอง ให้ตรวจจับอัตโนมัติ
        checkBackgroundBrightness();
    }
});

    // ฟังก์ชันเปิด/ปิด Sidebar และเลื่อนปุ่มฟันเฟืองพร้อมกัน
    async function toggleSidebar(open) {
        if (open) {
            settingsSidebar.style.right = "0";
            await delay(10);
            settingsSidebar.style.opacity = "1";
            gearButton.style.right = "330px";
        } else {
            settingsSidebar.style.opacity = "0";
            gearButton.style.right = "20px";
            await delay(300);
            settingsSidebar.style.right = "-300px";
        }
        sidebarOpen = open;
    }

    // เปิด Image Cropper
    function openCropper(imageData) {
        // ซ่อน Sidebar ก่อน
        toggleSidebar(false);
        
        // แสดง Cropper
        cropperContainer.classList.remove("hidden");
        cropperImage.src = imageData;
        imageSrc = imageData;
        
        // รอให้รูปโหลด
        cropperImage.onload = function() {
            // เก็บขนาดจริงของรูปภาพ
            originalImageSize.width = this.naturalWidth;
            originalImageSize.height = this.naturalHeight;
            
            // คำนวณขนาดที่จะแสดงในหน้าจอ
            containerSize.width = cropperImageContainer.clientWidth;
            containerSize.height = cropperImageContainer.clientHeight;
            
            // คำนวณอัตราส่วนการย่อ/ขยาย
            const widthRatio = containerSize.width / originalImageSize.width;
            const heightRatio = containerSize.height / originalImageSize.height;
            scale = Math.min(widthRatio, heightRatio, 1); // เลือกค่าที่น้อยที่สุด เพื่อให้รูปอยู่ใน container
            
            // คำนวณขนาดรูปหลังการปรับขนาด
            const scaledWidth = originalImageSize.width * scale;
            const scaledHeight = originalImageSize.height * scale;
            
            // ตั้งขนาดของรูป
            cropperImage.style.width = scaledWidth + "px";
            cropperImage.style.height = scaledHeight + "px";
            
            // ตั้งค่า frame เริ่มต้น (ประมาณ 80% ของรูป)
            const defaultRatio = 0.8;
            frameSize.width = scaledWidth * defaultRatio;
            frameSize.height = scaledHeight * defaultRatio;
            
            // ตำแหน่งเริ่มต้นอยู่ตรงกลางรูป
            framePosition.x = (scaledWidth - frameSize.width) / 2;
            framePosition.y = (scaledHeight - frameSize.height) / 2;
            
            // อัพเดทการแสดงผล
            updateCropFrame();
        };
    }

    // อัพเดทการแสดงผลของกรอบครอป
    function updateCropFrame() {
        cropperFrame.style.left = framePosition.x + "px";
        cropperFrame.style.top = framePosition.y + "px";
        cropperFrame.style.width = frameSize.width + "px";
        cropperFrame.style.height = frameSize.height + "px";
    }

    // ปรับสัดส่วนของกรอบครอป
    function setAspectRatio(ratio) {
        selectedRatio = ratio;
        
        // กรณีอิสระไม่ต้องปรับอะไร
        if (ratio === "free") {
            return;
        }
        
        // คำนวณสัดส่วนใหม่
        let aspectRatio;
        if (ratio === "16:9") {
            aspectRatio = 16/9;
        } else if (ratio === "9:16") {
            aspectRatio = 9/16;
        } else if (ratio === "1:1") {
            aspectRatio = 1;
        } else {
            return;
        }
        
        // ตัวแปรเก็บขนาดเดิม
        const oldWidth = frameSize.width;
        const oldHeight = frameSize.height;
        
        // ถ้าภาพกว้างกว่า ให้ปรับความสูงตามความกว้าง
        if (aspectRatio > 1 || aspectRatio === 1) {
            frameSize.height = frameSize.width / aspectRatio;
        } 
        // ถ้าภาพสูงกว่า ให้ปรับความกว้างตามความสูง
        else {
            frameSize.width = frameSize.height * aspectRatio;
        }
        
        // ปรับตำแหน่งให้อยู่ตรงกลางของกรอบเดิม
        framePosition.x += (oldWidth - frameSize.width) / 2;
        framePosition.y += (oldHeight - frameSize.height) / 2;
        
        // ป้องกันกรอบออกนอกรูป
        constrainFrameToImage();
        
        // อัพเดทการแสดงผล
        updateCropFrame();
    }
    // ป้องกันกรอบออกนอกรูป
    function constrainFrameToImage() {
        const scaledWidth = originalImageSize.width * scale;
        const scaledHeight = originalImageSize.height * scale;
        
        // ป้องกันกรอบใหญ่เกินรูป
        if (frameSize.width > scaledWidth) {
            frameSize.width = scaledWidth;
            
            // ถ้ามีการกำหนดสัดส่วน ให้ปรับความสูงตามด้วย
            if (selectedRatio !== "free") {
                if (selectedRatio === "16:9") {
                    frameSize.height = frameSize.width / (16/9);
                } else if (selectedRatio === "9:16") {
                    frameSize.height = frameSize.width / (9/16);
                } else if (selectedRatio === "1:1") {
                    frameSize.height = frameSize.width;
                }
            }
        }
        if (frameSize.height > scaledHeight) {
            frameSize.height = scaledHeight;
            
            // ถ้ามีการกำหนดสัดส่วน ให้ปรับความกว้างตามด้วย
            if (selectedRatio !== "free") {
                if (selectedRatio === "16:9") {
                    frameSize.width = frameSize.height * (16/9);
                } else if (selectedRatio === "9:16") {
                    frameSize.width = frameSize.height * (9/16);
                } else if (selectedRatio === "1:1") {
                    frameSize.width = frameSize.height;
                }
            }
        }
        
        // ป้องกันกรอบออกนอกรูป
        if (framePosition.x < 0) framePosition.x = 0;
        if (framePosition.y < 0) framePosition.y = 0;
        if (framePosition.x + frameSize.width > scaledWidth) {
            framePosition.x = scaledWidth - frameSize.width;
        }
        if (framePosition.y + frameSize.height > scaledHeight) {
            framePosition.y = scaledHeight - frameSize.height;
        }
    }

    // ปิด Image Cropper
    function closeCropper() {
        cropperContainer.classList.add("hidden");
    }

    // ฟังก์ชันสำหรับกำหนดรูปแบบการแสดงภาพพื้นหลัง
    function applyBackgroundFit(fitType) {
        switch(fitType) {
            case "cover":
                wallpaperDiv.style.backgroundSize = "cover";
                wallpaperDiv.style.backgroundPosition = "center";
                break;
            case "contain":
                wallpaperDiv.style.backgroundSize = "contain";
                wallpaperDiv.style.backgroundPosition = "center";
                wallpaperDiv.style.backgroundRepeat = "no-repeat";
                break;
            case "custom":
                // เปิดหน้าต่างควบคุมตำแหน่งและขนาดภาพ
                openCustomPositionControl();
                break;
            default:
                wallpaperDiv.style.backgroundSize = "cover";
                wallpaperDiv.style.backgroundPosition = "center";
        }
    }

    // ฟังก์ชันเปิดหน้าต่างควบคุมตำแหน่งและขนาดภาพแบบกำหนดเอง
    function openCustomPositionControl() {
        // ปิด sidebar ก่อน
        toggleSidebar(false);
        
        // ถ้ามีหน้าต่างเดิมอยู่แล้ว ให้ลบออกก่อน
        const existingControl = document.getElementById("custom-position-container");
        if (existingControl) {
            existingControl.remove();
        }
        
        // สร้างหน้าต่างควบคุม
        const customControlContainer = document.createElement("div");
        customControlContainer.id = "custom-position-container";
        
        const customControlHeader = document.createElement("div");
        customControlHeader.className = "custom-control-header";
        
        const customControlTitle = document.createElement("h3");
        customControlTitle.textContent = "ปรับแต่งตำแหน่งและขนาดภาพ";
        
        const closeCustomControl = document.createElement("button");
        closeCustomControl.textContent = "❌";
        closeCustomControl.className = "close-custom-control";
        closeCustomControl.addEventListener("click", () => {
            customControlContainer.remove();
        });
        
        customControlHeader.appendChild(customControlTitle);
        customControlHeader.appendChild(closeCustomControl);
        
        // สร้างตัวควบคุมตำแหน่งและขนาด
        const controlsWrapper = document.createElement("div");
        controlsWrapper.className = "custom-controls-wrapper";
        
        // ตัวควบคุมตำแหน่ง X
        const posXControl = createSliderControl("pos-x", "ตำแหน่งแนวนอน", 0, 100, 50, "left", "%");
        
        // ตัวควบคุมตำแหน่ง Y
        const posYControl = createSliderControl("pos-y", "ตำแหน่งแนวตั้ง", 0, 100, 50, "top", "%");
        
        // ตัวควบคุมขนาด
        const sizeControl = createSliderControl("size", "ขนาด", 50, 200, 100, "size", "%");
        
        controlsWrapper.appendChild(posXControl);
        controlsWrapper.appendChild(posYControl);
        controlsWrapper.appendChild(sizeControl);
        
        // ปุ่มบันทึก
        const saveButton = document.createElement("button");
        saveButton.className = "button-style";
        saveButton.textContent = "บันทึกการตั้งค่า";
        saveButton.addEventListener("click", () => {
            // บันทึกค่าลงใน storage
            const posX = document.getElementById("pos-x-slider").value;
            const posY = document.getElementById("pos-y-slider").value;
            const size = document.getElementById("size-slider").value;
            
            storage.get(["wallpaper"]).then(data => {
                storage.set({ 
                    wallpaper: data.wallpaper, 
                    bgFit: "custom",
                    customBgSettings: {
                        posX: posX,
                        posY: posY,
                        size: size
                    }
                });
            });
            
            customControlContainer.remove();
        });
        
        // จัดเรียงองค์ประกอบ
        customControlContainer.appendChild(customControlHeader);
        customControlContainer.appendChild(controlsWrapper);
        customControlContainer.appendChild(saveButton);
        
        document.body.appendChild(customControlContainer);
        
        // โหลดค่าที่บันทึกไว้
        storage.get(["customBgSettings"]).then(data => {
            if (data.customBgSettings) {
                document.getElementById("pos-x-slider").value = data.customBgSettings.posX;
                document.getElementById("pos-y-slider").value = data.customBgSettings.posY;
                document.getElementById("size-slider").value = data.customBgSettings.size;
                
                document.getElementById("pos-x-value").textContent = data.customBgSettings.posX + "%";
                document.getElementById("pos-y-value").textContent = data.customBgSettings.posY + "%";
                document.getElementById("size-value").textContent = data.customBgSettings.size + "%";
                
                // อัพเดทการแสดงผลภาพพื้นหลัง
                updateCustomBackground(
                    data.customBgSettings.posX,
                    data.customBgSettings.posY,
                    data.customBgSettings.size
                );
            }
        });
    }

    // ฟังก์ชันสร้างตัวควบคุมแบบ slider
    function createSliderControl(id, label, min, max, defaultValue, property, unit) {
        const controlContainer = document.createElement("div");
        controlContainer.className = "slider-control";
        
        const controlLabel = document.createElement("div");
        controlLabel.className = "slider-label";
        controlLabel.textContent = label;
        
        const controlValue = document.createElement("div");
        controlValue.className = "slider-value";
        controlValue.id = `${id}-value`;
        controlValue.textContent = defaultValue + unit;
        
        const labelRow = document.createElement("div");
        labelRow.className = "slider-label-row";
        labelRow.appendChild(controlLabel);
        labelRow.appendChild(controlValue);
        
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = min;
        slider.max = max;
        slider.value = defaultValue;
        slider.className = "custom-slider";
        slider.id = `${id}-slider`;
        
        // เพิ่ม event listener
        slider.addEventListener("input", (e) => {
            const value = e.target.value;
            controlValue.textContent = value + unit;
            
            // อัพเดทการแสดงผลภาพพื้นหลัง
            const posX = document.getElementById("pos-x-slider").value;
            const posY = document.getElementById("pos-y-slider").value;
            const size = document.getElementById("size-slider").value;
            
            updateCustomBackground(posX, posY, size);
        });
        
        controlContainer.appendChild(labelRow);
        controlContainer.appendChild(slider);
        
        return controlContainer;
    }

    // ฟังก์ชันอัพเดทการแสดงผลภาพพื้นหลังแบบกำหนดเอง
    function updateCustomBackground(posX, posY, size) {
        wallpaperDiv.style.backgroundSize = `${size}%`;
        wallpaperDiv.style.backgroundPosition = `${posX}% ${posY}%`;
        wallpaperDiv.style.backgroundRepeat = "no-repeat";
    }

    // ฟังก์ชันครอปและบันทึก
    function cropAndSave() {
        // สร้าง canvas เพื่อครอปรูป
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // คำนวณสัดส่วนการครอปจากรูปจริง
        const cropX = framePosition.x / scale;
        const cropY = framePosition.y / scale;
        const cropWidth = frameSize.width / scale;
        const cropHeight = frameSize.height / scale;
        
        // ตั้งขนาด canvas ตามขนาดที่ต้องการครอป
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        // วาดส่วนที่ครอปลงบน canvas
        ctx.drawImage(
            cropperImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // แปลงเป็น URL ข้อมูล
        const croppedImageData = canvas.toDataURL("image/jpeg", 0.9);
        
        // บันทึกพื้นหลังใหม่
        wallpaperDiv.style.backgroundImage = `url(${croppedImageData})`;
        
        // อัพเดตการแสดงผลพื้นหลังตามค่าที่เลือกไว้
        storage.get(["bgFit", "customBgSettings"]).then(data => {
            const fitType = data.bgFit || "cover";
            applyBackgroundFit(fitType);
            
            // ถ้าเป็นแบบกำหนดเอง ให้อัพเดทค่าที่เก็บไว้
            if (fitType === "custom" && data.customBgSettings) {
                updateCustomBackground(
                    data.customBgSettings.posX,
                    data.customBgSettings.posY,
                    data.customBgSettings.size
                );
            }
        });
        
        // บันทึกลงใน Storage และประวัติ
        storage.get(["history", "bgFit", "customBgSettings"]).then(data => {
            let history = data.history || [];
            history.unshift(croppedImageData);
            history = history.slice(0, 10);
            
            const storageData = { 
                wallpaper: croppedImageData, 
                history
            };
            
            // เก็บค่าการแสดงผลภาพพื้นหลัง
            if (data.bgFit) {
                storageData.bgFit = data.bgFit;
            }
            
            if (data.customBgSettings) {
                storageData.customBgSettings = data.customBgSettings;
            }
            
            storage.set(storageData);
            loadHistory();
            updateGearContrast();
        });
        
        // ปิด Cropper
        closeCropper();
    }

    // เมื่อเริ่มลากกรอบหรือย่อขยาย
    function startDrag(e) {
        isDragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        
        // เช็คว่ากำลังลากตำแหน่งไหน
        const target = e.target;
        if (target === cropperFrame) {
            dragType = "move";
        } else if (target.classList.contains("tl-handle")) {
            dragType = "resize-tl";
        } else if (target.classList.contains("tr-handle")) {
            dragType = "resize-tr";
        } else if (target.classList.contains("bl-handle")) {
            dragType = "resize-bl";
        } else if (target.classList.contains("br-handle")) {
            dragType = "resize-br";
        }
    }

    // เมื่อมีการลากกรอบหรือย่อขยาย
    function doDrag(e) {
        if (!isDragging) return;
        
        const moveX = e.clientX - dragStart.x;
        const moveY = e.clientY - dragStart.y;
        
        // อัพเดทค่าเริ่มต้นในการลากครั้งถัดไป
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        
        if (dragType === "move") {
            // เลื่อนตำแหน่งกรอบ
            framePosition.x += moveX;
            framePosition.y += moveY;
        } else if (dragType === "resize-tl") {
            // ย่อขยายจากมุมซ้ายบน
            const oldX = framePosition.x;
            const oldY = framePosition.y;
            const oldWidth = frameSize.width;
            const oldHeight = frameSize.height;
            
            framePosition.x += moveX;
            framePosition.y += moveY;
            frameSize.width -= moveX;
            frameSize.height -= moveY;
            
            // ปรับสัดส่วนถ้ามีการกำหนดค่า
            if (selectedRatio !== "free") {
                handleAspectRatioResize("tl");
            }
        } else if (dragType === "resize-tr") {
            // ย่อขยายจากมุมขวาบน
            const oldY = framePosition.y;
            const oldHeight = frameSize.height;
            
            framePosition.y += moveY;
            frameSize.width += moveX;
            frameSize.height -= moveY;
            
            // ปรับสัดส่วนถ้ามีการกำหนดค่า
            if (selectedRatio !== "free") {
                handleAspectRatioResize("tr");
            }
        } else if (dragType === "resize-bl") {
            // ย่อขยายจากมุมซ้ายล่าง
            const oldX = framePosition.x;
            const oldWidth = frameSize.width;
            
            framePosition.x += moveX;
            frameSize.width -= moveX;
            frameSize.height += moveY;
            
            // ปรับสัดส่วนถ้ามีการกำหนดค่า
            if (selectedRatio !== "free") {
                handleAspectRatioResize("bl");
            }
        } else if (dragType === "resize-br") {
            // ย่อขยายจากมุมขวาล่าง
            frameSize.width += moveX;
            frameSize.height += moveY;
            
            // ปรับสัดส่วนถ้ามีการกำหนดค่า
            if (selectedRatio !== "free") {
                handleAspectRatioResize("br");
            }
        }
        
        // ป้องกันขนาดติดลบ
        if (frameSize.width < 20) frameSize.width = 20;
        if (frameSize.height < 20) frameSize.height = 20;
        
        // ป้องกันกรอบออกนอกรูป
        constrainFrameToImage();
        
        // อัพเดทการแสดงผล
        updateCropFrame();
    }

    // จัดการสัดส่วนภาพเมื่อย่อขยาย
    function handleAspectRatioResize(corner) {
        let aspectRatio;
        if (selectedRatio === "16:9") {
            aspectRatio = 16/9;
        } else if (selectedRatio === "9:16") {
            aspectRatio = 9/16;
        } else if (selectedRatio === "1:1") {
            aspectRatio = 1;
        }
        
        if (corner === "tl") {
            // ปรับจากมุมซ้ายบน (ใช้ความกว้างเป็นตัวกำหนด)
            const oldHeight = frameSize.height;
            frameSize.height = frameSize.width / aspectRatio;
            framePosition.y += (oldHeight - frameSize.height);
        } else if (corner === "tr") {
            // ปรับจากมุมขวาบน (ใช้ความกว้างเป็นตัวกำหนด)
            const oldHeight = frameSize.height;
            frameSize.height = frameSize.width / aspectRatio;
            framePosition.y += (oldHeight - frameSize.height);
        } else if (corner === "bl") {
            // ปรับจากมุมซ้ายล่าง (ใช้ความสูงเป็นตัวกำหนด)
            const oldWidth = frameSize.width;
            frameSize.width = frameSize.height * aspectRatio;
            framePosition.x += (oldWidth - frameSize.width);
        } else if (corner === "br") {
            // ปรับจากมุมขวาล่าง (ใช้ความกว้างเป็นตัวกำหนด)
            frameSize.height = frameSize.width / aspectRatio;
        }
    }

    // เมื่อหยุดลากกรอบหรือย่อขยาย
    function stopDrag() {
        isDragging = false;
    }

    // Toggle Sidebar เมื่อกดปุ่มฟันเฟือง
    gearButton.addEventListener("click", () => {
        toggleSidebar(!sidebarOpen);
    });

    // ปิด Sidebar เมื่อกดปุ่ม ❌
    closeSidebarButton.addEventListener("click", () => {
        toggleSidebar(false);
    });

    // กดปุ่มครอป
    cropButton.addEventListener("click", cropAndSave);
    
    // กดปุ่มยกเลิกครอป
    cancelCropButton.addEventListener("click", closeCropper);
    
    // เปลี่ยน Aspect Ratio
    const ratioButtons = document.querySelectorAll(".ratio-button");
    ratioButtons.forEach(button => {
        button.addEventListener("click", function() {
            // ยกเลิกการเลือกทั้งหมด
            ratioButtons.forEach(btn => btn.classList.remove("active"));
            // เลือกปุ่มนี้
            this.classList.add("active");
            
            // ตั้งค่า Aspect Ratio ใหม่
            const ratio = this.dataset.ratio;
            setAspectRatio(ratio);
        });
    });

    // Event listeners สำหรับการลากกรอบและย่อขยาย
    cropperFrame.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("mouseleave", stopDrag);
    
    // แฮนเดิลย่อขยาย
    const handles = document.querySelectorAll(".cropper-handle");
    handles.forEach(handle => {
        handle.addEventListener("mousedown", startDrag);
    });

    // โหลด Wallpaper ล่าสุด
    storage.get(["wallpaper", "bgFit", "customBgSettings"]).then(data => {
        if (data.wallpaper) {
            wallpaperDiv.style.backgroundImage = `url(${data.wallpaper})`;
            
            // โหลดค่าการแสดงผลภาพพื้นหลัง
            const fitType = data.bgFit || "cover";
            
            // อัพเดทการแสดงผลภาพพื้นหลัง
            if (fitType === "contain") {
                wallpaperDiv.style.backgroundSize = "contain";
                wallpaperDiv.style.backgroundPosition = "center";
                wallpaperDiv.style.backgroundRepeat = "no-repeat";
            } else if (fitType === "custom" && data.customBgSettings) {
                updateCustomBackground(
                    data.customBgSettings.posX,
                    data.customBgSettings.posY,
                    data.customBgSettings.size
                );
            } else {
                // ค่าเริ่มต้นเป็น cover
                wallpaperDiv.style.backgroundSize = "cover";
                wallpaperDiv.style.backgroundPosition = "center";
            }
            
            // ทำ active ตัวเลือกที่ถูกเลือก
            document.querySelectorAll(".bg-fit-option").forEach(el => {
                if (el.dataset.fit === fitType) {
                    el.classList.add("active");
                }
            });
            
            updateGearContrast(); // ตรวจสอบสีฟันเฟืองตอนโหลด
        }
    });

    // โหลดประวัติ Wallpaper
    function loadHistory() {
        storage.get("history").then(data => {
            historyDiv.innerHTML = ""; // เคลียร์ประวัติเก่า

            if (data.history && data.history.length > 0) {
                data.history.forEach((image, index) => {
                    const historyItem = document.createElement("div");
                    historyItem.className = "history-item";
                    historyItem.style.backgroundImage = `url(${image})`;
                    historyItem.addEventListener("click", () => {
                        wallpaperDiv.style.backgroundImage = `url(${image})`;
                        storage.set({ wallpaper: image });
                        
                        // โหลดค่าการแสดงผลภาพพื้นหลัง
                        storage.get(["bgFit", "customBgSettings"]).then(settingsData => {
                            const fitType = settingsData.bgFit || "cover";
                            
                            // อัพเดทการแสดงผลภาพพื้นหลัง
                            if (fitType === "contain") {
                                wallpaperDiv.style.backgroundSize = "contain";
                                wallpaperDiv.style.backgroundPosition = "center";
                                wallpaperDiv.style.backgroundRepeat = "no-repeat";
                            } else if (fitType === "custom" && settingsData.customBgSettings) {
                                updateCustomBackground(
                                    settingsData.customBgSettings.posX,
                                    settingsData.customBgSettings.posY,
                                    settingsData.customBgSettings.size
                                );
                            } else {
                                // ค่าเริ่มต้นเป็น cover
                                wallpaperDiv.style.backgroundSize = "cover";
                                wallpaperDiv.style.backgroundPosition = "center";
                            }
                        });
                        
                        updateGearContrast(); // อัปเดตสีฟันเฟือง
                    });

                    // ปุ่มลบ ❌
                    const deleteButton = document.createElement("div");
                    deleteButton.className = "delete-history";
                    deleteButton.innerText = "❌";
                    deleteButton.addEventListener("click", (event) => {
                        event.stopPropagation(); // กันไม่ให้ Wallpaper เปลี่ยน
                        data.history.splice(index, 1);
                        storage.set({ history: data.history });
                        loadHistory(); // โหลดใหม่
                    });

                    historyItem.appendChild(deleteButton);
                    historyDiv.appendChild(historyItem);
                });
            }
        });
    }

    // กด "Default Theme" → เปลี่ยนเป็นสีขาว
    defaultThemeDiv.addEventListener("click", () => {
        wallpaperDiv.style.backgroundImage = "none";
        wallpaperDiv.style.backgroundColor = "#ffffff";
        storage.set({ wallpaper: "#ffffff" });
        updateGearContrast(); // อัปเดตสีฟันเฟือง
    });

    // อัปโหลดรูปใหม่
    uploadInput.addEventListener("change", event => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                const imageData = e.target.result;
                // แทนที่จะตั้งเป็น Wallpaper ทันที ให้เปิด Cropper ก่อน
                openCropper(imageData);
            };
            reader.readAsDataURL(file);
        }
    });
    // สร้างฟังก์ชันสำหรับแสดง Color Picker
// อัพเดตฟังก์ชัน openColorPicker เพื่อจัดวางองค์ประกอบใหม่ให้กระชับขึ้น
function openColorPicker() {
    // ปิด sidebar ก่อน
    toggleSidebar(false);
    
    // ถ้ามีหน้าต่างเดิมอยู่แล้ว ให้ลบออกก่อน
    const existingPicker = document.getElementById("color-picker-container");
    if (existingPicker) {
        existingPicker.remove();
    }
    
    // สร้างหน้าต่าง Color Picker
    const colorPickerContainer = document.createElement("div");
    colorPickerContainer.id = "color-picker-container";
    
    const colorPickerHeader = document.createElement("div");
    colorPickerHeader.className = "color-picker-header";
    
    const colorPickerTitle = document.createElement("h3");
    colorPickerTitle.textContent = "เลือกสีพื้นหลัง";
    
    const closeColorPicker = document.createElement("button");
    closeColorPicker.textContent = "❌";
    closeColorPicker.className = "close-color-picker";
    closeColorPicker.addEventListener("click", () => {
        colorPickerContainer.remove();
    });
    
    colorPickerHeader.appendChild(colorPickerTitle);
    colorPickerHeader.appendChild(closeColorPicker);
    
    // สร้างส่วน HTML5 Color Picker (ย้ายขึ้นมาก่อน)
    const html5ColorSection = document.createElement("div");
    html5ColorSection.className = "html5-color-section";
    
    const html5ColorRow = document.createElement("div");
    html5ColorRow.className = "html5-color-row";
    
    const html5ColorPicker = document.createElement("input");
    html5ColorPicker.type = "color";
    html5ColorPicker.id = "html5-color-picker";
    html5ColorPicker.className = "html5-color-picker";
    html5ColorPicker.value = "#FFFFFF";
    
    const colorInput = document.createElement("input");
    colorInput.type = "text";
    colorInput.id = "color-input";
    colorInput.className = "color-input";
    colorInput.placeholder = "ใส่รหัสสี (เช่น #FF0000)";
    colorInput.value = "#FFFFFF";
    
    // จัดเรียงในแนวนอน
    html5ColorRow.appendChild(html5ColorPicker);
    html5ColorRow.appendChild(colorInput);
    html5ColorSection.appendChild(html5ColorRow);
    
    // สร้างส่วนเลือกสีแบบ Color Palette
    const colorPaletteSection = document.createElement("div");
    colorPaletteSection.className = "color-palette-section";
    
    const colorPalette = document.createElement("div");
    colorPalette.className = "color-palette";
    
    // สร้างตัวเลือกสีพื้นฐาน (ลดจำนวนลงเหลือ 12 สี)
    const basicColors = [
        "#000000", "#FFFFFF", "#FF0000", "#00FF00", 
        "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", 
        "#FF8800", "#88FF00", "#0088FF", "#FF0088"
    ];
    
    basicColors.forEach(color => {
        const colorOption = document.createElement("div");
        colorOption.className = "color-option";
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        colorOption.title = color;
        
        colorOption.addEventListener("click", () => {
            applyBackgroundColor(color);
            colorPickerContainer.remove();
        });
        
        colorPalette.appendChild(colorOption);
    });
    
    // รวมแถบตัวอย่างสีกับปุ่มบันทึก
    const previewAndApplyRow = document.createElement("div");
    previewAndApplyRow.className = "preview-apply-row";
    
    const colorPreview = document.createElement("div");
    colorPreview.className = "color-preview";
    colorPreview.id = "color-preview";
    colorPreview.style.backgroundColor = colorInput.value;
    
    const applyColorButton = document.createElement("button");
    applyColorButton.className = "button-style";
    applyColorButton.id = "apply-color-button";
    applyColorButton.textContent = "ใช้สีนี้";
    
    previewAndApplyRow.appendChild(colorPreview);
    previewAndApplyRow.appendChild(applyColorButton);
    
    // อัพเดทสีตัวอย่างเมื่อกรอกรหัสสี
    colorInput.addEventListener("input", () => {
        try {
            const colorValue = colorInput.value.trim();
            if (colorValue) {
                // ตรวจสอบว่าเป็นรหัสสีที่ถูกต้องไหม
                if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue) || 
                    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(colorValue) ||
                    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d\.]+\s*\)$/.test(colorValue)) {
                    
                    colorPreview.style.backgroundColor = colorValue;
                }
            }
        } catch (error) {
            console.error("ไม่สามารถตั้งค่าสี:", error);
        }
    });
    
    // อัพเดทเมื่อเลือกสีด้วย HTML5 Color Picker
    html5ColorPicker.addEventListener("input", () => {
        const color = html5ColorPicker.value;
        colorInput.value = color;
        colorPreview.style.backgroundColor = color;
    });
    
    // ปุ่มบันทึกสี
    applyColorButton.addEventListener("click", () => {
        const color = colorInput.value.trim();
        if (color) {
            applyBackgroundColor(color);
            colorPickerContainer.remove();
        }
    });
    
    // จัดเรียงส่วนประกอบทั้งหมด
    colorPickerContainer.appendChild(colorPickerHeader);
    colorPickerContainer.appendChild(html5ColorSection);
    colorPickerContainer.appendChild(colorPaletteSection);
    colorPickerContainer.appendChild(colorPalette);
    colorPickerContainer.appendChild(previewAndApplyRow);
    
    document.body.appendChild(colorPickerContainer);
}

// เพิ่มโค้ด JavaScript นี้ลงในไฟล์ newtab.js

// ฟังก์ชันเกี่ยวกับ Search Bar
function setupSearchBar() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchEngineButtons = document.querySelectorAll('.search-engine');
    
    // ตรวจสอบว่าองค์ประกอบมีอยู่จริง
    if (!searchInput || !searchClear || searchEngineButtons.length === 0) {
        console.error('Search bar elements not found');
        return; // ยกเลิกการทำงานถ้าไม่พบองค์ประกอบ
    }    

    // ค่าเริ่มต้นของ search engine
    let currentEngine = 'google';
    
    // โหลดค่า search engine ที่บันทึกไว้
    storage.get('searchEngine').then(data => {
        if (data.searchEngine) {
            currentEngine = data.searchEngine;
            
            // ทำ active ปุ่มที่เลือก
            searchEngineButtons.forEach(button => {
                if (button.dataset.engine === currentEngine) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    });
    
    // ฟังก์ชันทำการค้นหา
    // แก้ไขฟังก์ชันทำการค้นหา
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        let searchUrl;
        switch(currentEngine) {
            case 'bing':
                searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'duck':
                searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                break;
            case 'youtube':
                searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                break;
            case 'google':
            default:
                searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                break;
        }
        
        // เปิดในแท็บใหม่แทน (มักทำงานได้ดีกว่าในส่วนขยายบราวเซอร์)
        window.open(searchUrl, '_blank');
        
        // ล้างข้อความค้นหาหลังจากค้นหาแล้ว
        searchInput.value = '';
        searchClear.classList.add('hidden');
    }
    
    // เมื่อกด Enter ในช่องค้นหา
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // แสดง/ซ่อนปุ่มล้างข้อความค้นหา
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim()) {
            searchClear.classList.remove('hidden');
        } else {
            searchClear.classList.add('hidden');
        }
    });
    
    // ล้างข้อความค้นหา
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        searchClear.classList.add('hidden');
    });
    
    // การเลือก search engine
    searchEngineButtons.forEach(button => {
        button.addEventListener('click', () => {
            // อัพเดท active state
            searchEngineButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // อัพเดทค่า current engine
            currentEngine = button.dataset.engine;
            
            // บันทึกการเลือกลงใน storage
            storage.set({ searchEngine: currentEngine });
            
            // focus ช่องค้นหา
            searchInput.focus();
        });
    });
    
    // ตรวจสอบธีมและปรับ theme ของ search bar
    function updateSearchBarTheme() {
        const body = document.body;
        const brightness = getBackgroundBrightness();
        
        if (brightness < 128) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }
    
    // ฟังก์ชันวัดความสว่างของพื้นหลัง
    function getBackgroundBrightness() {
        const bgColor = window.getComputedStyle(wallpaperDiv).backgroundColor;
        const rgb = bgColor.match(/\d+/g);
        
        if (rgb) {
            return (parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114);
        }
        
        return 255; // ค่าเริ่มต้นหากไม่สามารถวัดความสว่างได้
    }
    
    // ตรวจสอบความสว่างเมื่อโหลดหน้า
    updateSearchBarTheme();
    
    // เพิ่ม observer สำหรับการเปลี่ยนแปลงของ wallpaper
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'style') {
                updateSearchBarTheme();
            }
        });
    });
    
    observer.observe(wallpaperDiv, { attributes: true });
    
    // Focus ช่องค้นหาเมื่อโหลดหน้า
    setTimeout(() => {
        searchInput.focus();
    }, 100);
}

// เรียกใช้ฟังก์ชัน setupSearchBar
setupSearchBar();

// ฟังก์ชันสำหรับเปลี่ยนสีพื้นหลัง
function applyBackgroundColor(color) {
    wallpaperDiv.style.backgroundColor = color;
    wallpaperDiv.style.backgroundImage = "none";
    storage.set({ wallpaper: color });
    updateGearContrast(); // อัปเดตสีฟันเฟือง
}

// เปลี่ยน Event Listener ของปุ่มเลือกสี
chooseColorButton.removeEventListener("click", chooseColorButton.clickHandler);

// สร้าง Event Handler แบบใหม่
chooseColorButton.clickHandler = () => {
    openColorPicker();
};

// ผูก Event Handler แบบใหม่
chooseColorButton.addEventListener("click", chooseColorButton.clickHandler);

// เลือกสีพื้นหลัง - แทนที่โค้ดเดิมด้วยโค้ดนี้
chooseColorButton.addEventListener("click", function() {
    openColorPicker();
});

    // เมื่อหน้าโหลดเสร็จ ให้ปรับสีฟันเฟือง
    setTimeout(updateGearContrast, 500);
    
    // โหลดประวัติเมื่อโหลดหน้า
    loadHistory();
});