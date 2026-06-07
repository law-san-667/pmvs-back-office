export type SerializedFile = {
  name: string;
  type: string;
  base64: string;
};

export const serializeFile = (file: File): Promise<SerializedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Unable to read file."));
        return;
      }

      resolve({
        name: file.name,
        type: file.type,
        base64: result.split(",")[1] ?? "",
      });
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Unable to read file."));
    });
    reader.readAsDataURL(file);
  });

export const appendSerializedFile = (
  formData: FormData,
  fieldName: string,
  file: SerializedFile | undefined,
) => {
  if (!file) {
    return;
  }

  const buffer = Buffer.from(file.base64, "base64");
  formData.append(
    fieldName,
    new File([buffer], file.name, { type: file.type }),
  );
};
