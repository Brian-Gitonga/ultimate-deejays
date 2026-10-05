/*
 * Database types, generated from supabase/migrations (do not edit by hand).
 * Same shape as `supabase gen types typescript`, so `npm run db:types`
 * can replace this file once the project is linked.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_notification_state: {
        Row: {
          admin_id: string;
          last_read_at: string;
        };
        Insert: {
          admin_id?: string;
          last_read_at?: string;
        };
        Update: {
          admin_id?: string;
          last_read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_notification_state_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_accounts: {
        Row: {
          affiliate_id: string;
          payout_method: string;
          paypal_email: string;
          mpesa_phone: string;
          bank: Json;
          tax: Json;
          notifications: Json;
          website: string;
          channels: string;
          code_request: string | null;
          leave_requested_at: string | null;
          updated_at: string;
        };
        Insert: {
          affiliate_id?: string;
          payout_method?: string;
          paypal_email?: string;
          mpesa_phone?: string;
          bank?: Json;
          tax?: Json;
          notifications?: Json;
          website?: string;
          channels?: string;
          code_request?: string | null;
          leave_requested_at?: string | null;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          payout_method?: string;
          paypal_email?: string;
          mpesa_phone?: string;
          bank?: Json;
          tax?: Json;
          notifications?: Json;
          website?: string;
          channels?: string;
          code_request?: string | null;
          leave_requested_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_accounts_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: true;
            referencedRelation: "affiliate_applications";
            referencedColumns: ["user_id"];
          },
        ];
      };
      affiliate_applications: {
        Row: {
          user_id: string;
          channel: string;
          channel_url: string;
          audience: number;
          pitch: string;
          status: Database["public"]["Enums"]["affiliate_status"];
          code: string | null;
          commission: number;
          note: string;
          applied_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          approved_at: string | null;
          updated_at: string;
          customer_discount: number | null;
        };
        Insert: {
          user_id: string;
          channel: string;
          channel_url: string;
          audience?: number;
          pitch: string;
          status?: Database["public"]["Enums"]["affiliate_status"];
          code?: string | null;
          commission?: number;
          note?: string;
          applied_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
          customer_discount?: number | null;
        };
        Update: {
          user_id?: string;
          channel?: string;
          channel_url?: string;
          audience?: number;
          pitch?: string;
          status?: Database["public"]["Enums"]["affiliate_status"];
          code?: string | null;
          commission?: number;
          note?: string;
          applied_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          approved_at?: string | null;
          updated_at?: string;
          customer_discount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_links: {
        Row: {
          id: string;
          affiliate_id: string;
          label: string;
          path: string;
          sub: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          affiliate_id?: string;
          label: string;
          path?: string;
          sub: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          affiliate_id?: string;
          label?: string;
          path?: string;
          sub?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_applications";
            referencedColumns: ["user_id"];
          },
        ];
      };
      affiliate_payouts: {
        Row: {
          id: string;
          affiliate_id: string;
          amount: number;
          method: string;
          period: string;
          note: string;
          paid_by: string | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          affiliate_id: string;
          amount: number;
          method?: string;
          period?: string;
          note?: string;
          paid_by?: string | null;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          affiliate_id?: string;
          amount?: number;
          method?: string;
          period?: string;
          note?: string;
          paid_by?: string | null;
          is_demo?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_applications";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "affiliate_payouts_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          body: string;
          category: string;
          keywords: string[];
          cover: string;
          status: Database["public"]["Enums"]["post_status"];
          publish_at: string;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title?: string;
          excerpt?: string;
          body?: string;
          category?: string;
          keywords?: string[];
          cover?: string;
          status?: Database["public"]["Enums"]["post_status"];
          publish_at?: string;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string;
          body?: string;
          category?: string;
          keywords?: string[];
          cover?: string;
          status?: Database["public"]["Enums"]["post_status"];
          publish_at?: string;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_entries: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string | null;
          name: string;
          email: string;
          youtube_url: string;
          youtube_id: string;
          status: Database["public"]["Enums"]["entry_status"];
          score: number | null;
          notes: string;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id?: string | null;
          name: string;
          email: string;
          youtube_url: string;
          youtube_id: string;
          status?: Database["public"]["Enums"]["entry_status"];
          score?: number | null;
          notes?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          youtube_url?: string;
          youtube_id?: string;
          status?: Database["public"]["Enums"]["entry_status"];
          score?: number | null;
          notes?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_entries_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          id: string;
          slug: string;
          title: string;
          tagline: string;
          type: Database["public"]["Enums"]["challenge_type"];
          difficulty: string;
          opens: string;
          closes: string;
          image: string;
          prize: string;
          brief: string;
          rules: string[];
          judging: Json;
          inspiration: Json;
          winners: Json | null;
          published: boolean;
          entry_count: number;
          sample_entries: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title?: string;
          tagline?: string;
          type?: Database["public"]["Enums"]["challenge_type"];
          difficulty?: string;
          opens?: string;
          closes?: string;
          image?: string;
          prize?: string;
          brief?: string;
          rules?: string[];
          judging?: Json;
          inspiration?: Json;
          winners?: Json | null;
          published?: boolean;
          entry_count?: number;
          sample_entries?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          tagline?: string;
          type?: Database["public"]["Enums"]["challenge_type"];
          difficulty?: string;
          opens?: string;
          closes?: string;
          image?: string;
          prize?: string;
          brief?: string;
          rules?: string[];
          judging?: Json;
          inspiration?: Json;
          winners?: Json | null;
          published?: boolean;
          entry_count?: number;
          sample_entries?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checkouts: {
        Row: {
          id: string;
          reference: string;
          user_id: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          kind: string;
          list_price: number;
          discount: number;
          amount: number;
          currency: string;
          coupon_code: string;
          coupon_id: string | null;
          affiliate_id: string | null;
          commission_rate: number;
          ref_sub: string;
          status: string;
          payment_id: string | null;
          failure: string;
          created_at: string;
          updated_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          reference: string;
          user_id: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          kind?: string;
          list_price: number;
          discount?: number;
          amount: number;
          currency?: string;
          coupon_code?: string;
          coupon_id?: string | null;
          affiliate_id?: string | null;
          commission_rate?: number;
          ref_sub?: string;
          status?: string;
          payment_id?: string | null;
          failure?: string;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          reference?: string;
          user_id?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          kind?: string;
          list_price?: number;
          discount?: number;
          amount?: number;
          currency?: string;
          coupon_code?: string;
          coupon_id?: string | null;
          affiliate_id?: string | null;
          commission_rate?: number;
          ref_sub?: string;
          status?: string;
          payment_id?: string | null;
          failure?: string;
          created_at?: string;
          updated_at?: string;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "checkouts_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_applications";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "checkouts_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkouts_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkouts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string;
          discount_type: string;
          discount_value: number;
          plans: Database["public"]["Enums"]["plan_tier"][];
          max_redemptions: number | null;
          redemptions: number;
          once_per_customer: boolean;
          starts_at: string | null;
          expires_at: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string;
          discount_type?: string;
          discount_value: number;
          plans?: Database["public"]["Enums"]["plan_tier"][];
          max_redemptions?: number | null;
          redemptions?: number;
          once_per_customer?: boolean;
          starts_at?: string | null;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string;
          discount_type?: string;
          discount_value?: number;
          plans?: Database["public"]["Enums"]["plan_tier"][];
          max_redemptions?: number | null;
          redemptions?: number;
          once_per_customer?: boolean;
          starts_at?: string | null;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_lessons: {
        Row: {
          course_id: string;
          id: string;
          section_id: string;
          slug: string;
          title: string;
          summary: string;
          youtube: string;
          duration_seconds: number;
          preview: boolean;
          resources: Json;
          source: string;
          position: number;
        };
        Insert: {
          course_id: string;
          id: string;
          section_id: string;
          slug: string;
          title?: string;
          summary?: string;
          youtube?: string;
          duration_seconds?: number;
          preview?: boolean;
          resources?: Json;
          source?: string;
          position?: number;
        };
        Update: {
          course_id?: string;
          id?: string;
          section_id?: string;
          slug?: string;
          title?: string;
          summary?: string;
          youtube?: string;
          duration_seconds?: number;
          preview?: boolean;
          resources?: Json;
          source?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_lessons_course_id_section_id_fkey";
            columns: ["course_id", "section_id"];
            isOneToOne: false;
            referencedRelation: "course_sections";
            referencedColumns: ["course_id", "id"];
          },
        ];
      };
      course_reviews: {
        Row: {
          id: string;
          course_id: string;
          user_id: string | null;
          reviewer_name: string;
          reviewer_avatar: string | null;
          rating: number;
          body: string;
          status: string;
          reply: string;
          replied_at: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id?: string | null;
          reviewer_name?: string;
          reviewer_avatar?: string | null;
          rating: number;
          body?: string;
          status?: string;
          reply?: string;
          replied_at?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string | null;
          reviewer_name?: string;
          reviewer_avatar?: string | null;
          rating?: number;
          body?: string;
          status?: string;
          reply?: string;
          replied_at?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      course_sections: {
        Row: {
          course_id: string;
          id: string;
          title: string;
          position: number;
        };
        Insert: {
          course_id: string;
          id: string;
          title?: string;
          position?: number;
        };
        Update: {
          course_id?: string;
          id?: string;
          title?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string;
          description: string;
          category: string;
          subcategory: string;
          level: string;
          language: string;
          access_plan: Database["public"]["Enums"]["plan_tier"];
          thumbnail: string;
          promo_video: string;
          outcomes: string[];
          requirements: string[];
          audience: string[];
          drip: boolean;
          status: Database["public"]["Enums"]["course_status"];
          instructor_id: string | null;
          duration_minutes: number;
          enrolled_count: number;
          review_count: number;
          rating_total: number;
          sample_students: number;
          sample_rating: number;
          sample_reviews: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title?: string;
          subtitle?: string;
          description?: string;
          category?: string;
          subcategory?: string;
          level?: string;
          language?: string;
          access_plan?: Database["public"]["Enums"]["plan_tier"];
          thumbnail?: string;
          promo_video?: string;
          outcomes?: string[];
          requirements?: string[];
          audience?: string[];
          drip?: boolean;
          status?: Database["public"]["Enums"]["course_status"];
          instructor_id?: string | null;
          duration_minutes?: number;
          enrolled_count?: number;
          review_count?: number;
          rating_total?: number;
          sample_students?: number;
          sample_rating?: number;
          sample_reviews?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          subtitle?: string;
          description?: string;
          category?: string;
          subcategory?: string;
          level?: string;
          language?: string;
          access_plan?: Database["public"]["Enums"]["plan_tier"];
          thumbnail?: string;
          promo_video?: string;
          outcomes?: string[];
          requirements?: string[];
          audience?: string[];
          drip?: boolean;
          status?: Database["public"]["Enums"]["course_status"];
          instructor_id?: string | null;
          duration_minutes?: number;
          enrolled_count?: number;
          review_count?: number;
          rating_total?: number;
          sample_students?: number;
          sample_rating?: number;
          sample_reviews?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          user_id: string;
          course_id: string;
          source: string;
          enrolled_at: string;
          last_lesson_at: string | null;
          last_lesson_slug: string | null;
        };
        Insert: {
          user_id: string;
          course_id: string;
          source?: string;
          enrolled_at?: string;
          last_lesson_at?: string | null;
          last_lesson_slug?: string | null;
        };
        Update: {
          user_id?: string;
          course_id?: string;
          source?: string;
          enrolled_at?: string;
          last_lesson_at?: string | null;
          last_lesson_slug?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      instructors: {
        Row: {
          id: string;
          slug: string;
          name: string;
          specialty: string;
          bio: string;
          image: string;
          email: string;
          position: number;
          show_on_about: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          specialty?: string;
          bio?: string;
          image?: string;
          email?: string;
          position?: number;
          show_on_about?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          specialty?: string;
          bio?: string;
          image?: string;
          email?: string;
          position?: number;
          show_on_about?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          user_id: string;
          course_id: string;
          lesson_slug: string;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          lesson_slug: string;
          completed_at?: string;
        };
        Update: {
          user_id?: string;
          course_id?: string;
          lesson_slug?: string;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          id: string;
          path: string;
          url: string;
          name: string;
          alt: string;
          folder: string;
          mime_type: string;
          size_bytes: number;
          width: number | null;
          height: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          url: string;
          name?: string;
          alt?: string;
          folder?: string;
          mime_type?: string;
          size_bytes?: number;
          width?: number | null;
          height?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          url?: string;
          name?: string;
          alt?: string;
          folder?: string;
          mime_type?: string;
          size_bytes?: number;
          width?: number | null;
          height?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mix_submissions: {
        Row: {
          id: string;
          user_id: string | null;
          submitter_name: string;
          title: string;
          link: string;
          course_id: string | null;
          notes: string;
          status: string;
          feedback: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          submitter_name?: string;
          title: string;
          link: string;
          course_id?: string | null;
          notes?: string;
          status?: string;
          feedback?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          submitter_name?: string;
          title?: string;
          link?: string;
          course_id?: string | null;
          notes?: string;
          status?: string;
          feedback?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mix_submissions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mix_submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mix_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          user_id: string | null;
          source: string;
          created_at: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          user_id?: string | null;
          source?: string;
          created_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          user_id?: string | null;
          source?: string;
          created_at?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          reference: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          country: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          kind: string;
          amount: number;
          fee: number;
          currency: string;
          method: Database["public"]["Enums"]["payment_method"];
          source: string;
          status: Database["public"]["Enums"]["payment_status"];
          paid_at: string;
          refunded_at: string | null;
          affiliate_id: string | null;
          commission: number;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
          discount: number;
          coupon_code: string;
          ref_sub: string;
          checkout_id: string | null;
        };
        Insert: {
          id?: string;
          reference: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          country?: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          kind?: string;
          amount: number;
          fee?: number;
          currency?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          source?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          paid_at?: string;
          refunded_at?: string | null;
          affiliate_id?: string | null;
          commission?: number;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          discount?: number;
          coupon_code?: string;
          ref_sub?: string;
          checkout_id?: string | null;
        };
        Update: {
          id?: string;
          reference?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          country?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          kind?: string;
          amount?: number;
          fee?: number;
          currency?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          source?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          paid_at?: string;
          refunded_at?: string | null;
          affiliate_id?: string | null;
          commission?: number;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
          discount?: number;
          coupon_code?: string;
          ref_sub?: string;
          checkout_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_applications";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "payments_checkout_id_fkey";
            columns: ["checkout_id"];
            isOneToOne: false;
            referencedRelation: "checkouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          id: string;
          reference: string;
          amount: number;
          destination: string;
          status: string;
          period: string;
          requested_by: string | null;
          paid_at: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference?: string;
          amount: number;
          destination?: string;
          status?: string;
          period?: string;
          requested_by?: string | null;
          paid_at?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          amount?: number;
          destination?: string;
          status?: string;
          period?: string;
          requested_by?: string | null;
          paid_at?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          dj_name: string;
          location: string;
          bio: string;
          experience: Database["public"]["Enums"]["dj_experience"];
          genres: string[];
          instagram: string;
          soundcloud: string;
          avatar_url: string | null;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
          updated_at: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          status: string;
          last_seen_at: string | null;
          referred_by: string | null;
          referred_at: string | null;
          email_prefs: Json;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          dj_name?: string;
          location?: string;
          bio?: string;
          experience?: Database["public"]["Enums"]["dj_experience"];
          genres?: string[];
          instagram?: string;
          soundcloud?: string;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: string;
          last_seen_at?: string | null;
          referred_by?: string | null;
          referred_at?: string | null;
          email_prefs?: Json;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          dj_name?: string;
          location?: string;
          bio?: string;
          experience?: Database["public"]["Enums"]["dj_experience"];
          genres?: string[];
          instagram?: string;
          soundcloud?: string;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          status?: string;
          last_seen_at?: string | null;
          referred_by?: string | null;
          referred_at?: string | null;
          email_prefs?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_clicks: {
        Row: {
          id: number;
          affiliate_id: string;
          path: string;
          sub: string;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: never;
          affiliate_id: string;
          path?: string;
          sub?: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: never;
          affiliate_id?: string;
          path?: string;
          sub?: string;
          is_demo?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referral_clicks_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_applications";
            referencedColumns: ["user_id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: string;
          data: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          data?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          data?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      store_downloads: {
        Row: {
          id: number;
          resource_id: string;
          user_id: string | null;
          files: number;
          counted: boolean;
          created_at: string;
        };
        Insert: {
          id?: never;
          resource_id: string;
          user_id?: string | null;
          files?: number;
          counted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: never;
          resource_id?: string;
          user_id?: string | null;
          files?: number;
          counted?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_downloads_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "store_resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_downloads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      store_files: {
        Row: {
          id: string;
          resource_id: string;
          name: string;
          kind: string;
          path: string;
          url: string;
          size_bytes: number;
          mime_type: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          name: string;
          kind: string;
          path?: string;
          url?: string;
          size_bytes?: number;
          mime_type?: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          resource_id?: string;
          name?: string;
          kind?: string;
          path?: string;
          url?: string;
          size_bytes?: number;
          mime_type?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_files_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "store_resources";
            referencedColumns: ["id"];
          },
        ];
      };
      store_resources: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          thumbnail: string;
          preview_url: string;
          access_plan: Database["public"]["Enums"]["plan_tier"];
          instructor_id: string | null;
          status: string;
          featured: boolean;
          download_count: number;
          is_demo: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string;
          category?: string;
          thumbnail?: string;
          preview_url?: string;
          access_plan?: Database["public"]["Enums"]["plan_tier"];
          instructor_id?: string | null;
          status?: string;
          featured?: boolean;
          download_count?: number;
          is_demo?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          category?: string;
          thumbnail?: string;
          preview_url?: string;
          access_plan?: Database["public"]["Enums"]["plan_tier"];
          instructor_id?: string | null;
          status?: string;
          featured?: boolean;
          download_count?: number;
          is_demo?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_resources_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "instructors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      admin_activity: {
        Row: {
          id: string | null;
          kind: string | null;
          title: string | null;
          detail: string | null;
          href: string | null;
          created_at: string | null;
        };
        Relationships: [];
      };
      affiliate_overview: {
        Row: {
          id: string | null;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
          channel: string | null;
          channel_url: string | null;
          audience: number | null;
          pitch: string | null;
          status: Database["public"]["Enums"]["affiliate_status"] | null;
          code: string | null;
          commission: number | null;
          note: string | null;
          applied_at: string | null;
          approved_at: string | null;
          updated_at: string | null;
          clicks: number | null;
          signups: number | null;
          sales: number | null;
          revenue: number | null;
          earned: number | null;
          paid_out: number | null;
        };
        Relationships: [];
      };
      enrollment_progress: {
        Row: {
          user_id: string | null;
          course_id: string | null;
          course_slug: string | null;
          course_title: string | null;
          source: string | null;
          enrolled_at: string | null;
          last_lesson_at: string | null;
          lessons_total: number | null;
          lessons_done: number | null;
        };
        Relationships: [];
      };
      store_download_stats: {
        Row: {
          resource_id: string | null;
          downloads: number | null;
          last_30_days: number | null;
          people: number | null;
          last_download_at: string | null;
        };
        Relationships: [];
      };
      student_overview: {
        Row: {
          id: string | null;
          full_name: string | null;
          dj_name: string | null;
          email: string | null;
          avatar_url: string | null;
          location: string | null;
          plan: Database["public"]["Enums"]["plan_tier"] | null;
          status: string | null;
          created_at: string | null;
          last_seen_at: string | null;
          updated_at: string | null;
          referred_by: string | null;
          challenge_entries: number | null;
          mixes_submitted: number | null;
          paid: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      attach_referral: { Args: { ref_code: string }; Returns: boolean };
      can_enter_challenge: { Args: { target: string }; Returns: boolean };
      challenge_is_open: { Args: { target: string }; Returns: boolean };
      fulfill_checkout: { Args: { checkout_reference: string; paid_amount: number; paid_fee: number; paid_method: Database["public"]["Enums"]["payment_method"]; paid_source: string; paid_country: string; paid_at: string }; Returns: string };
      generate_affiliate_code: { Args: { base: string }; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      is_approved_affiliate: { Args: never; Returns: boolean };
      is_enrolled: { Args: { target: string }; Returns: boolean };
      lesson_video: { Args: { course_slug: string; lesson_slug: string }; Returns: Json };
      mix_quota_left: { Args: never; Returns: number };
      my_affiliate_clicks: { Args: never; Returns: { day: string; sub: string; clicks: number }[] };
      my_affiliate_referrals: { Args: never; Returns: { id: string; paid_at: string; customer: string; country: string; plan: Database["public"]["Enums"]["plan_tier"]; kind: string; amount: number; commission: number; status: Database["public"]["Enums"]["payment_status"]; refunded_at: string; used_code: boolean; ref_sub: string }[] };
      my_affiliate_signups: { Args: never; Returns: { created_at: string }[] };
      refresh_course_counts: { Args: { target: string }; Returns: undefined };
      save_course: { Args: { payload: Json }; Returns: string };
      store_download: { Args: { resource_slug: string; file_ids?: string[] }; Returns: Json };
      studio_lesson_media: { Args: { target?: string }; Returns: { course_id: string; id: string; youtube: string; resources: Json }[] };
      studio_store_files: { Args: { target?: string }; Returns: { id: string; resource_id: string; name: string; kind: string; path: string; url: string; size_bytes: number; mime_type: string; position: number }[] };
      touch_last_seen: { Args: never; Returns: undefined };
      track_referral_click: { Args: { ref_code: string; landing_path?: string; sub_id?: string }; Returns: boolean };
    };
    Enums: {
      affiliate_status: "pending" | "approved" | "paused" | "rejected";
      app_role: "user" | "admin";
      challenge_type: "scratch" | "mixing" | "transitions" | "genre";
      course_status: "draft" | "review" | "published";
      dj_experience: "new" | "bedroom" | "gigging" | "pro";
      entry_status: "submitted" | "shortlisted" | "winner" | "disqualified";
      payment_method: "card" | "paypal" | "mobile_money" | "bank_transfer" | "free";
      payment_status: "paid" | "refunded";
      plan_tier: "warm-up" | "resident" | "headliner";
      post_status: "draft" | "scheduled" | "published";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"] | keyof PublicSchema["Views"]> = T extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][T]["Row"]
  : T extends keyof PublicSchema["Views"]
    ? PublicSchema["Views"][T]["Row"]
    : never;
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
