declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HOST: string;
      PORT?: number;
      OPENAI_API_KEY: string;
      TELEGRAM_BOT_TOKEN: string;
      DATABASE_URL: string;
    }
  }
}

export {};
