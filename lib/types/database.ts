export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          usdc_wallet_address: string | null
          twitter_handle: string | null
          instagram_handle: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          usdc_wallet_address?: string | null
          twitter_handle?: string | null
          instagram_handle?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          usdc_wallet_address?: string | null
          twitter_handle?: string | null
          instagram_handle?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          profile_id: string
          title: string
          description: string
          generation_source: 'ai' | 'human'
          mux_asset_id: string
          mux_playback_id: string | null
          view_count: number
          unlock_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          description: string
          generation_source?: 'ai' | 'human'
          mux_asset_id: string
          mux_playback_id?: string | null
          view_count?: number
          unlock_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          description?: string
          generation_source?: 'ai' | 'human'
          mux_asset_id?: string
          mux_playback_id?: string | null
          view_count?: number
          unlock_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          video_id: string
          profile_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          profile_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          profile_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      comment_votes: {
        Row: {
          comment_id: string
          profile_id: string
          value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          comment_id: string
          profile_id: string
          value: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          comment_id?: string
          profile_id?: string
          value?: number
          created_at?: string
          updated_at?: string
        }
      }
      video_ratings: {
        Row: {
          video_id: string
          profile_id: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          video_id: string
          profile_id: string
          rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          video_id?: string
          profile_id?: string
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      increment_video_view_count: {
        Args: {
          video_uuid: string
        }
        Returns: number
      }
    }
  }
}

