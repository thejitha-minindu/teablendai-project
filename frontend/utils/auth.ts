export const getUserFromToken = () => {
    try {
      if (typeof window === 'undefined') return null;
      
      const token = localStorage.getItem("teablend_token");
      if (!token) return null;
      
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      
      const payload = JSON.parse(atob(payloadBase64));
      return payload;
    } catch (error) {
      console.error("Failed to decode token", error);
      // Optional: Clear corrupted token
      localStorage.removeItem("teablend_token");
      return null;
    }
};
