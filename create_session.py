import instaloader
import sys

def create_session(sessionid):
    L = instaloader.Instaloader()
    L.context.username = "company87085"
    
    # Set the cookies required for Instagram authentication
    L.context._session.cookies.set("sessionid", sessionid, domain=".instagram.com")
    
    try:
        print("Testing login with provided sessionid...")
        L.test_login()
        L.save_session_to_file("company87085.session")
        print("\n✅ SUCCESS: company87085.session has been created!")
        print("You can now run: python instagram_scraper.py")
    except Exception as e:
        print(f"\n❌ FAILED to authenticate: {e}")
        print("Make sure you copied the entire sessionid exactly as it appears in the browser.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_session(sys.argv[1])
    else:
        print("Usage: python create_session.py <YOUR_SESSION_ID>")
