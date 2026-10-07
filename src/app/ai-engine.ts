// ai-engine.ts
const CATEGORIES = ['Mouse', 'Monitor', 'Keyboard', 'Mousepad', 'Headphone', 'Gamepad'];

// 1. Vectorization: แปลงหมวดหมู่สินค้าให้เป็นตัวเลข Array (One-Hot Encoding)
const getProductVector = (category: string) => {
  return CATEGORIES.map(cat => (category === cat ? 1 : 0));
};

// 2. Machine Learning Algorithm: คำนวณหาระยะห่างของข้อมูล (Cosine Similarity)
const calculateCosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += Math.pow(vecA[i], 2);
    normB += Math.pow(vecB[i], 2);
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// 3. ฟังก์ชันพยากรณ์ความชอบ (Prediction)
export const predictAIMatchScore = (productCategory: string, userHistory: Record<string, number>) => {
  const productVector = getProductVector(productCategory);
  
  // สกัด User Profile Vector จากพฤติกรรมในเซสชันปัจจุบัน
  const userVector = CATEGORIES.map(cat => userHistory[cat] || 0);

  // ถ้ายูสเซอร์ยังไม่เคยกดอะไรเลย ให้สุ่มความน่าจะเป็นพื้นฐาน (Base Probability 20-40%)
  const isUserEmpty = userVector.every(v => v === 0);
  if (isUserEmpty) return Math.floor(Math.random() * 21) + 20;

  // คำนวณความแม่นยำด้วย Cosine Similarity
  const similarity = calculateCosineSimilarity(userVector, productVector);
  
  // แปลงค่าเป็นเปอร์เซ็นต์ (0-100%) และบวก Noise เล็กน้อยเพื่อความสมจริงของโมเดล
  let percentage = Math.round(similarity * 100);
  if (percentage > 0) {
    percentage = Math.min(percentage + Math.floor(Math.random() * 5), 99);
  } else {
    percentage = Math.floor(Math.random() * 15) + 10; // สินค้าที่ไม่เข้าพวกเลยจะได้คะแนนต่ำ
  }
  
  return percentage;
};