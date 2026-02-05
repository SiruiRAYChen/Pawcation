import { storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const uploadMemoryPhoto = async (params: {
  file: File;
  userId: string;
  tripId: string | number;
}) => {
  const { file, userId, tripId } = params;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `memoryPhotos/${userId}/${tripId}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, filePath);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
};
