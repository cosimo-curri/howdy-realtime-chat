package com.web.howdy;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;

import android.graphics.drawable.LayerDrawable;
import android.media.MediaPlayer;
import android.os.AsyncTask;
import android.os.Handler;
import android.support.constraint.ConstraintLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.suke.widget.SwitchButton;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.security.SecureRandom;

import de.hdodenhof.circleimageview.CircleImageView;

public class AuthActivity extends AppCompatActivity {
    ConstraintLayout authLayout;
    Window window;
    MediaPlayer mediaPlayer;

    CircleImageView profilePicture;
    ProgressBar loadingProfilePicture;
    ImageView imgDayNight;
    SwitchButton switchDayNight;
    ImageView imgLogout;
    ImageView imgVolume;
    TextView lblUsername;
    TextView lblEmail;
    ProgressBar progressBar;

    EditText txtNumber1;
    EditText txtNumber2;
    EditText txtNumber3;
    EditText txtNumber4;
    EditText txtNumber5;
    EditText txtNumber6;

    Handler code2FA_handler;
    Handler timerHandler;

    String code2FA;
    int progress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //CODING IN EVERY ACTIVITY
        ActionBar actionBar = getSupportActionBar();

        if(actionBar != null)
            actionBar.hide();

        setContentView(R.layout.activity_auth);

        authLayout = findViewById(R.id.authLayout);

        mediaPlayer = MediaPlayer.create(this, R.raw.bloop);

        profilePicture = findViewById(R.id.profilePicture);
        loadingProfilePicture = findViewById(R.id.loadingProfilePicture);
        imgDayNight = findViewById(R.id.imgDayNight);
        switchDayNight = findViewById(R.id.switchDayNight);
        imgLogout = findViewById(R.id.imgLogout);
        imgVolume = findViewById(R.id.imgVolume);
        lblUsername = findViewById(R.id.lblUsername);
        lblEmail = findViewById(R.id.lblEmail);
        progressBar = findViewById(R.id.progressBar);

        txtNumber1 = findViewById(R.id.txtNumber1);
        txtNumber2 = findViewById(R.id.txtNumber2);
        txtNumber3 = findViewById(R.id.txtNumber3);
        txtNumber4 = findViewById(R.id.txtNumber4);
        txtNumber5 = findViewById(R.id.txtNumber5);
        txtNumber6 = findViewById(R.id.txtNumber6);

        txtNumber1.setEnabled(false);
        txtNumber2.setEnabled(false);
        txtNumber3.setEnabled(false);
        txtNumber4.setEnabled(false);
        txtNumber5.setEnabled(false);
        txtNumber6.setEnabled(false);

        SharedPreferences sharedPreferences = getSharedPreferences("LOGGED_USER", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();

        String username = sharedPreferences.getString("username", "");
        String email = sharedPreferences.getString("email", "");
        // The account password is never persisted. Only an encrypted device credential is stored.

        String _id = sharedPreferences.getString("_id", "");

        boolean day = sharedPreferences.getBoolean("day", true);
        boolean volume = sharedPreferences.getBoolean("volume", true);

        progressBar.setProgress(0);

        code2FA_handler = new Handler();

        timerHandler = new Handler();

        Runnable timerRunnable = new Runnable() {
            @Override
            public void run() {
                progress = progressBar.getProgress();
                progressBar.setProgress(progress + 1);

                if(progress >= progressBar.getMax()) {
                    timerHandler.removeCallbacks(this);
                } else {
                    timerHandler.postDelayed(this, 100);
                }
            }
        };

        Runnable code2FA_runnable = new Runnable() {
            @Override
            public void run() {
                code2FA = randomCode2FA();

                progress = 0;
                progressBar.setProgress(0);

                txtNumber1.setText(String.valueOf(code2FA.charAt(0)));
                txtNumber2.setText(String.valueOf(code2FA.charAt(1)));
                txtNumber3.setText(String.valueOf(code2FA.charAt(2)));
                txtNumber4.setText(String.valueOf(code2FA.charAt(3)));
                txtNumber5.setText(String.valueOf(code2FA.charAt(4)));
                txtNumber6.setText(String.valueOf(code2FA.charAt(5)));

                String code2FA = txtNumber1.getText().toString() + txtNumber2.getText().toString() + txtNumber3.getText().toString() + txtNumber4.getText().toString() + txtNumber5.getText().toString() + txtNumber6.getText().toString();

                JSONObject json = new JSONObject();

                try {
                    json.put("deviceToken", SecureDeviceToken.read(AuthActivity.this));
                    json.put("code2FA", code2FA);

                    JsonObjectRequest request = new JsonObjectRequest(
                        Request.Method.PUT,
                        MainActivity.BASE_URL + "/api/android/setCode2FA",
                        json,

                        new Response.Listener<JSONObject>() {
                            @Override
                            public void onResponse(JSONObject response) {
                                try {
                                    String message = response.getString("message");
                                    String username = response.getString("username");
                                    String profilePictureURL = response.getString("profilePictureURL");

                                    new ImageBitmapDownloader().execute(profilePictureURL);

                                    if(message.equals("SET_CODE_2FA_OK"))
                                        lblUsername.setText(username);
                                    else {
                                        Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                        errorHandler(editor, day, volume);
                                    }
                                } catch(JSONException e) {
                                    Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                    errorHandler(editor, day, volume);
                                }
                            }
                        },

                        new Response.ErrorListener(){
                            @Override
                            public void onErrorResponse(VolleyError error) {
                                Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();

                                new Handler().postDelayed(new Runnable() {
                                    @Override
                                    public void run() {
                                        startActivity(new Intent(AuthActivity.this, LoginActivity.class));
                                        overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right);
                                        finish();
                                    }
                                }, 2000);
                            }
                        }
                    );

                    Volley.newRequestQueue(getApplicationContext()).add(request);
                } catch(Exception e) {
                    Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                    errorHandler(editor, day, volume);
                }

                code2FA_handler.postDelayed(this, 10000);

                timerHandler.removeCallbacks(timerRunnable);
                timerHandler.postDelayed(timerRunnable, 0);
            }
        };

        JSONObject json = new JSONObject();

        try {
            json.put("deviceToken", SecureDeviceToken.read(AuthActivity.this));

            JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.POST,
                MainActivity.BASE_URL + "/api/android/session",
                json,

                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        try {
                            String message = response.getString("message");

                            if(message.equals("LOGIN_OK")) {
                                JSONObject userJSON = response.getJSONObject("user");

                                String username = userJSON.getString("username");
                                String email = userJSON.getString("email");
                                String profilePictureURL = userJSON.getString("profilePictureURL");

                                lblUsername.setText(username);
                                lblUsername.setBackground(null);
                                lblUsername.setTextColor(Color.parseColor("#00af23"));

                                lblEmail.setText(email);
                                lblEmail.setBackground(null);

                                if(day)
                                    lblEmail.setTextColor(Color.parseColor("#808080"));
                                else
                                    lblEmail.setTextColor(Color.parseColor("#A0A0A0"));

                                new ImageBitmapDownloader().execute(profilePictureURL);

                                code2FA_handler.postDelayed(code2FA_runnable, 0);
                            } else if(message.equals("USER_NOT_ACTIVE")) {
                                Toast.makeText(AuthActivity.this, "User not active", Toast.LENGTH_SHORT).show();
                                errorHandler(editor, day, volume);
                            } else {
                                Toast.makeText(AuthActivity.this, "User not found", Toast.LENGTH_SHORT).show();
                                errorHandler(editor, day, volume);
                            }
                        } catch(JSONException e) {
                            Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                            errorHandler(editor, day, volume);
                        }
                    }
                },

                new Response.ErrorListener(){
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();

                        new Handler().postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                startActivity(new Intent(AuthActivity.this, LoginActivity.class));
                                overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right);
                                finish();
                            }
                        }, 2000);
                    }
                }
            );

            Volley.newRequestQueue(getApplicationContext()).add(request);
        } catch(Exception e) {
            Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
            errorHandler(editor, day, volume);
        }

        window = getWindow();

        if(day) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#000000"));

            imgDayNight.setImageResource(R.drawable.sun);
            switchDayNight.setChecked(false);

            manageDrawable(true);
        } else {
            imgDayNight.setImageResource(R.drawable.cloud_moon);
            switchDayNight.setChecked(true);
            applyDarkTheme();
        }

        if(volume) {
            imgVolume.setImageResource(R.drawable.volume);
        } else {
            imgVolume.setImageResource(R.drawable.mute);
        }

        imgLogout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                clickAudio(sharedPreferences);

                code2FA_handler.removeCallbacks(code2FA_runnable);
                timerHandler.removeCallbacks(timerRunnable);

                JSONObject logoutData = new JSONObject();
                try {
                    logoutData.put("deviceToken", SecureDeviceToken.read(AuthActivity.this));
                } catch (Exception e) {
                    Toast.makeText(AuthActivity.this, "Device credential unavailable", Toast.LENGTH_SHORT).show();
                    return;
                }
                JsonObjectRequest request = new JsonObjectRequest(
                    Request.Method.POST,
                    MainActivity.BASE_URL + "/api/android/logout",
                    logoutData,

                    new Response.Listener<JSONObject>() {
                        @Override
                        public void onResponse(JSONObject response) {
                            try {
                                String authResult = response.getString("authResult");

                                if(authResult.equals("AUTH_2FA_DISABLE_OK")) {
                                    SecureDeviceToken.clear(AuthActivity.this);
                                    editor.clear();
                                    editor.putBoolean("day", day);
                                    editor.putBoolean("volume", volume);
                                    editor.apply();

                                    startActivity(new Intent(AuthActivity.this, MainActivity.class));
                                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                                    finish();
                                } else {
                                    Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                    errorHandler(editor, day, volume);
                                }
                            } catch(JSONException e) {
                                Toast.makeText(AuthActivity.this, ""+e, Toast.LENGTH_SHORT).show();
                                errorHandler(editor, day, volume);
                            }
                        }
                    },

                    new Response.ErrorListener() {
                        @Override
                        public void onErrorResponse(VolleyError error) {
                            Toast.makeText(AuthActivity.this, ""+error, Toast.LENGTH_SHORT).show();
                            errorHandler(editor, day, volume);
                        }
                    }
                );

                Volley.newRequestQueue(getApplicationContext()).add(request);
            }
        });

        imgVolume.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                boolean volume = sharedPreferences.getBoolean("volume", true);

                if(volume) {
                    editor.putBoolean("volume", false);
                    editor.apply();

                    imgVolume.setImageResource(R.drawable.mute);
                } else {
                    mediaPlayer.start();

                    editor.putBoolean("volume", true);
                    editor.apply();

                    imgVolume.setImageResource(R.drawable.volume);
                }
            }
        });

        switchDayNight.setOnCheckedChangeListener(new SwitchButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(SwitchButton view, boolean is_night) {
                clickAudio(sharedPreferences);

                if(is_night) {
                    editor.putBoolean("day", false);
                } else {
                    editor.putBoolean("day", true);
                }

                editor.apply();

                startActivity(new Intent(AuthActivity.this, MainActivity.class));
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
                finish();
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        code2FA_handler.removeCallbacksAndMessages(null);
        timerHandler.removeCallbacksAndMessages(null);
    }

    public void applyDarkTheme() {
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#333333"));

        authLayout.setBackgroundColor(Color.parseColor("#000000"));

        GradientDrawable gradientDrawable = new GradientDrawable();
        gradientDrawable.setColor(Color.parseColor("#333333"));

        float cornerRadius = getResources().getDimension(R.dimen.corner_radius);
        gradientDrawable.setCornerRadius(cornerRadius);

        lblUsername.setBackground(gradientDrawable);
        lblEmail.setBackground(gradientDrawable);

        lblUsername.setTextColor(Color.parseColor("#333333"));
        lblEmail.setTextColor(Color.parseColor("#333333"));

        manageDrawable(false);
    }

    public void manageDrawable(boolean day) {
        Drawable editTextDrawable = getResources().getDrawable(R.drawable.edit_text_border_bottom);
        LayerDrawable editTextLayerDrawable = (LayerDrawable) editTextDrawable;
        GradientDrawable editTextGradientDrawable = (GradientDrawable) editTextLayerDrawable.getDrawable(1);

        if(day) {
            editTextGradientDrawable.setColor(Color.parseColor("#f3f3f3"));

            txtNumber1.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtNumber2.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtNumber3.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtNumber4.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtNumber6.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtNumber5.setHintTextColor(Color.parseColor("#A9A9A9"));

            txtNumber1.setTextColor(Color.parseColor("#808080"));
            txtNumber2.setTextColor(Color.parseColor("#808080"));
            txtNumber3.setTextColor(Color.parseColor("#808080"));
            txtNumber4.setTextColor(Color.parseColor("#808080"));
            txtNumber6.setTextColor(Color.parseColor("#808080"));
            txtNumber5.setTextColor(Color.parseColor("#808080"));
        } else {
            editTextGradientDrawable.setColor(Color.parseColor("#333333"));

            txtNumber1.setHintTextColor(Color.parseColor("#707070"));
            txtNumber2.setHintTextColor(Color.parseColor("#707070"));
            txtNumber3.setHintTextColor(Color.parseColor("#707070"));
            txtNumber4.setHintTextColor(Color.parseColor("#707070"));
            txtNumber6.setHintTextColor(Color.parseColor("#707070"));
            txtNumber5.setHintTextColor(Color.parseColor("#707070"));

            txtNumber1.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber2.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber3.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber4.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber6.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber5.setTextColor(Color.parseColor("#A0A0A0"));
        }

        txtNumber1.setBackground(editTextDrawable);
        txtNumber2.setBackground(editTextDrawable);
        txtNumber3.setBackground(editTextDrawable);
        txtNumber4.setBackground(editTextDrawable);
        txtNumber6.setBackground(editTextDrawable);
        txtNumber5.setBackground(editTextDrawable);
    }

    public void clickAudio(SharedPreferences sharedPreferences) {
        boolean volume = sharedPreferences.getBoolean("volume", true);

        if(volume)
            mediaPlayer.start();
    }

    public class ImageBitmapDownloader extends AsyncTask<String, Void, Bitmap> {
        HttpURLConnection httpURLConnection;

        @Override
        protected Bitmap doInBackground(String... strings) {
            try {
                URL url = new URL(strings[0]);

                httpURLConnection = (HttpURLConnection) url.openConnection();
                InputStream inputStream = new BufferedInputStream(httpURLConnection.getInputStream());

                return BitmapFactory.decodeStream(inputStream);
            } catch(IOException e) {} finally {
                httpURLConnection.disconnect();
            }

            return null;
        }

        @Override
        protected void onPostExecute(Bitmap bitmap) {
            if(bitmap != null) {
                profilePicture.setImageBitmap(bitmap);
                loadingProfilePicture.setVisibility(View.GONE);
            } else
                Toast.makeText(AuthActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
        }
    }

    public void errorHandler(SharedPreferences.Editor editor, boolean day, boolean volume) {
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                editor.clear();
                editor.putBoolean("day", day);
                editor.putBoolean("volume", volume);
                editor.apply();

                startActivity(new Intent(AuthActivity.this, LoginActivity.class));
                overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right);
                finish();
            }
        }, 2000);
    }

    public String randomCode2FA() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(1000000);
        return String.format(java.util.Locale.US, "%06d", code);
    }
}