export interface Video {
  downloadUrl: string;
  author?: string;
  likes?: number | string;
  comments?: number | string;
  shares?: number | string;
  views?: number | string;
  description?: string;
  duration?: number;
  isMultiItem?: boolean;
  items?: Item[];
}

interface Item {
  url: string;
  type: 'video' | 'image';
  width?: number;
  height?: number;
  duration?: number;
}
