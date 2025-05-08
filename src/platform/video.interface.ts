export interface Video {
  downloadUrl: string;
  author?: string;
  likes?: number | string;
  comments?: number | string;
  shares?: number | string;
  views?: number | string;
  description?: string;
  duration?: number;
}
