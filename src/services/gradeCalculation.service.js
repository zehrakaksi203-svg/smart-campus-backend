/**
 * Sayısal nota göre harf notunu döndürür.
 */
const calculateLetterGrade = (score) => {
    if (score >= 90) return "AA";
    if (score >= 85) return "BA";
    if (score >= 80) return "BB";
    if (score >= 75) return "CB";
    if (score >= 70) return "CC";
    if (score >= 65) return "DC";
    if (score >= 60) return "DD";
    if (score >= 50) return "FD";
    return "FF";
  };
  
  /**
   * Harf notunu 4'lük sisteme çevirir.
   */
  const calculateGradePoint = (letterGrade) => {
    const points = {
      AA: 4.0,
      BA: 3.5,
      BB: 3.0,
      CB: 2.5,
      CC: 2.0,
      DC: 1.5,
      DD: 1.0,
      FD: 0.5,
      FF: 0.0
    };
  
    return points[letterGrade] ?? 0;
  };
  
  /**
   * Vize ve finale göre dönem sonu notunu hesaplar.
   */
  const calculateFinalScore = (midterm, final) => {
    return Number((midterm * 0.4 + final * 0.6).toFixed(2));
  };
  
  module.exports = {
    calculateFinalScore,
    calculateLetterGrade,
    calculateGradePoint
  };