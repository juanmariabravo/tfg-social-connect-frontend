import md5 from 'crypto-js/md5';

export function getGravatarUrl(email: string, size: number = 200): string {
  if (!email) {
    return `https://www.gravatar.com/avatar/default?s=${size}&d=identicon`;
  }
  const hash = md5(email.trim().toLowerCase()).toString();
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
