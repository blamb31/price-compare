import base64
import os
import sys
import re

def main():
    raw_secret = os.environ.get('ANDROID_KEYSTORE_BASE64', '').strip()
    if not raw_secret:
        print("ERROR: ANDROID_KEYSTORE_BASE64 environment variable is empty!")
        sys.exit(1)

    print(f"Raw ANDROID_KEYSTORE_BASE64 length: {len(raw_secret)} characters")

    # Remove all non-base64 characters
    clean_secret = re.sub(r'[^A-Za-z0-9+/=]', '', raw_secret)
    print(f"Cleaned secret length: {len(clean_secret)} characters")

    # Fix remainder if length % 4 != 0
    rem = len(clean_secret) % 4
    if rem == 1:
        clean_secret = clean_secret[:-1]
    elif rem > 1:
        clean_secret += '=' * (4 - rem)

    print(f"Final padded secret length: {len(clean_secret)} characters")

    try:
        decoded_bytes = base64.b64decode(clean_secret)
        print(f"Decoded binary size: {len(decoded_bytes)} bytes")

        output_path = os.path.join(os.getcwd(), 'android', 'app', 'release.keystore')
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(decoded_bytes)

        print(f"Successfully wrote release.keystore to {output_path}")

    except Exception as e:
        print(f"ERROR decoding base64 keystore: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
