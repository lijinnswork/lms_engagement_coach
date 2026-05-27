import asyncio
import httpx
import sys

async def main():
    url = "https://iimbx.site"
    print("Testing connection to:", url)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=10.0) as client:
            res = await client.get(url)
            print("Status:", res.status_code)
            print("Headers:", dict(res.headers))
            print("Content (truncated):", res.text[:200])
    except Exception as e:
        print("Error connecting to iimbx.site:", type(e), e)

    url_iimb = "https://iimbx.iimb.ac.in"
    print("\nTesting connection to:", url_iimb)
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=10.0) as client:
            res = await client.get(url_iimb)
            print("Status:", res.status_code)
            print("Headers:", dict(res.headers))
            print("Content (truncated):", res.text[:200])
    except Exception as e:
        print("Error connecting to iimbx.iimb.ac.in:", type(e), e)

if __name__ == '__main__':
    asyncio.run(main())
