
export default async function handler(request, response) {
  const { style = 'shapes', seed = 'default', color } = request.query;

  // Construct the DiceBear API URL
  let diceBearUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
  
  if (color) {
    diceBearUrl += `&color=${color}`;
  }
  
  try {
    const apiRes = await fetch(diceBearUrl);
    
    if (!apiRes.ok) {
      return response.status(apiRes.status).send(`Failed to fetch avatar: ${apiRes.statusText}`);
    }
    
    const svg = await apiRes.text();
    
    response.setHeader('Content-Type', 'image/svg+xml');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return response.send(svg);
  } catch (error) {
    return response.status(500).send(`Error: ${error.message}`);
  }
}
