// Function to fetch emails using Gmail API
export const fetchEmails = async (accessToken: string): Promise<any> => {
  const apiUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Gmail API responded with status ${response.status}`);
  }
  return await response.json();
};
