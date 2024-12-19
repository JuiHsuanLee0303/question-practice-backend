export interface Chapter {
  chapterNum: string;
  chapterName: string;
  questionCount: number;
  questionTypes: {
    [key: string]: number; // key is QuestionType, value is count
  };
}
