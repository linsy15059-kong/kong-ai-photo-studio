import {headers} from 'next/headers';
import {sessionEmail} from '../lib/password-auth';

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const h=await headers(),email=await sessionEmail(h.get('cookie'));if(!email)return null;return{userId:email,displayName:email.split('@')[0],email,fullName:null};
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user=await getChatGPTUser();if(user)return user;throw new Error('login_required:'+returnTo);
}

export function chatGPTSignInPath(returnTo: string): string{return `/access?return_to=${encodeURIComponent(returnTo.startsWith('/')?returnTo:'/')}`;}

export function chatGPTSignOutPath(returnTo = "/"): string{return `/api/auth?action=logout&return_to=${encodeURIComponent(returnTo.startsWith('/')?returnTo:'/')}`;}
