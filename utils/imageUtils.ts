
export const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                 if (base64) {
                    resolve(base64);
                } else {
                    reject(new Error('Failed to parse image data URL to base64.'));
                }
            };
            reader.onerror = (error) => reject(error);
        });
    } catch (error) {
        console.error("Error converting image URL to base64:", error);
        throw new Error("Could not process the base model image.");
    }
};
