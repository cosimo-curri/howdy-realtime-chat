package com.web.howdy;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.KeyPairGeneratorSpec;
import android.util.Base64;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Calendar;
import javax.crypto.Cipher;
import javax.security.auth.x500.X500Principal;

/** Stores the revocable 2FA device credential with a non-exportable Android Keystore key. */
public final class SecureDeviceToken {
    private static final String ALIAS = "howdy_2fa_device_v1";
    private static final String KEY = "device_credential_ciphertext";
    private static final String PREFS = "LOGGED_USER";
    private SecureDeviceToken() {}

    private static KeyStore store(Context context) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (!store.containsAlias(ALIAS)) {
            Calendar start = Calendar.getInstance();
            Calendar end = Calendar.getInstance();
            end.add(Calendar.YEAR, 20);
            KeyPairGeneratorSpec spec = new KeyPairGeneratorSpec.Builder(context)
                .setAlias(ALIAS)
                .setSubject(new X500Principal("CN=Howdy 2FA Device"))
                .setSerialNumber(BigInteger.ONE)
                .setStartDate(start.getTime())
                .setEndDate(end.getTime())
                .setKeySize(2048)
                .build();
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA", "AndroidKeyStore");
            generator.initialize(spec);
            generator.generateKeyPair();
            store.load(null);
        }
        return store;
    }

    public static void save(Context context, String deviceToken) throws Exception {
        if (deviceToken == null || !deviceToken.matches("[a-f0-9]{64}")) {
            throw new IllegalArgumentException("Invalid device credential");
        }
        PublicKey publicKey = store(context).getCertificate(ALIAS).getPublicKey();
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        String encrypted = Base64.encodeToString(
            cipher.doFinal(deviceToken.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, encrypted).apply();
    }

    public static String read(Context context) throws Exception {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String encrypted = prefs.getString(KEY, "");
        if (encrypted.isEmpty()) throw new IllegalStateException("No enrolled device credential");
        KeyStore keyStore = store(context);
        PrivateKey key = (PrivateKey) keyStore.getKey(ALIAS, null);
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.DECRYPT_MODE, key);
        return new String(cipher.doFinal(Base64.decode(encrypted, Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }

    public static void clear(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply();
    }
}
