import { useState } from "react";
import { Button, Modal, Tabs, Empty } from "antd";
import { UploadOutlined, PictureOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { uploadFirmLogo, uploadFirmStamp, uploadFirmSignature } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const FirmBrandingUpload = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("logo");
  const [logoFile, setLogoFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const dispatch = useDispatch();
  const { isLoading, user } = useSelector((state) => state.auth);

  const firmData = user?.firmId || user?.data?.firmId;
  const currentLogo = firmData?.settings?.firmLogo;
  const currentStamp = firmData?.settings?.firmStamp;
  const currentSignature = firmData?.settings?.firmSignature;

  const handleFileChange = (e, type) => {
    const { files } = e.target;
    if (files[0]) {
      const file = files[0];
      const previewURL = URL.createObjectURL(file);

      if (type === "logo") {
        setLogoFile(files[0]);
        setLogoPreview(previewURL);
      } else if (type === "stamp") {
        setStampFile(files[0]);
        setStampPreview(previewURL);
      } else if (type === "signature") {
        setSignatureFile(files[0]);
        setSignaturePreview(previewURL);
      }
    }
  };

  const validateImage = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return false;
    }
    return true;
  };

  const handleUpload = async (type) => {
    let file, uploadAction;

    if (type === "logo") {
      if (!logoFile) return toast.error("Please select a logo image");
      if (!validateImage(logoFile)) return;
      file = logoFile;
      uploadAction = uploadFirmLogo;
    } else if (type === "stamp") {
      if (!stampFile) return toast.error("Please select a stamp image");
      if (!validateImage(stampFile)) return;
      file = stampFile;
      uploadAction = uploadFirmStamp;
    } else if (type === "signature") {
      if (!signatureFile) return toast.error("Please select a signature image");
      if (!validateImage(signatureFile)) return;
      file = signatureFile;
      uploadAction = uploadFirmSignature;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      await dispatch(uploadAction(formData)).unwrap();
      // Reset form
      if (type === "logo") {
        setLogoFile(null);
        setLogoPreview(null);
      } else if (type === "stamp") {
        setStampFile(null);
        setStampPreview(null);
      } else if (type === "signature") {
        setSignatureFile(null);
        setSignaturePreview(null);
      }
      setOpen(false);
    } catch (error) {
      toast.error(error || "Upload failed");
    }
  };

  const ImageUploadField = ({ type, label, currentImage, preview, file }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          <UploadOutlined className="mr-2" />
          <span>Select File</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) => handleFileChange(e, type)}
            className="hidden"
          />
        </label>
        {file && (
          <span className="text-sm text-gray-500">{file.name}</span>
        )}
      </div>
      <div className="mt-4 flex justify-center">
        {preview || currentImage ? (
          <img
            src={preview || currentImage}
            alt={label}
            className="w-32 h-32 object-contain rounded-lg border border-gray-200"
          />
        ) : (
          <Empty description="No image" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
      <div className="mt-4 flex justify-center">
        <Button
          type="primary"
          loading={isLoading}
          onClick={() => handleUpload(type)}
          disabled={!file && !currentImage}
        >
          Upload {label}
        </Button>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: "logo",
      label: (
        <span>
          <PictureOutlined /> Logo
        </span>
      ),
      children: (
        <ImageUploadField
          type="logo"
          label="Firm Logo"
          currentImage={currentLogo}
          preview={logoPreview}
          file={logoFile}
        />
      ),
    },
    {
      key: "stamp",
      label: (
        <span>
          <PictureOutlined /> Stamp
        </span>
      ),
      children: (
        <ImageUploadField
          type="stamp"
          label="Firm Stamp"
          currentImage={currentStamp}
          preview={stampPreview}
          file={stampFile}
        />
      ),
    },
    {
      key: "signature",
      label: (
        <span>
          <PictureOutlined /> Signature
        </span>
      ),
      children: (
        <ImageUploadField
          type="signature"
          label="Firm Signature"
          currentImage={currentSignature}
          preview={signaturePreview}
          file={signatureFile}
        />
      ),
    },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-blue-500 text-white">
        <PictureOutlined className="mr-2" />
        Firm Branding
      </Button>
      <Modal
        title="Firm Branding Settings"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={500}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Modal>
    </>
  );
};

export default FirmBrandingUpload;
