package com.web.howdy;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.media.MediaPlayer;
import android.support.constraint.ConstraintLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.text.method.HideReturnsTransformationMethod;
import android.text.method.PasswordTransformationMethod;
import android.util.Patterns;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

public class LoginActivity extends AppCompatActivity {
    ConstraintLayout loginLayout;
    Window window;
    MediaPlayer mediaPlayer;

    EditText txtEmailUsername;
    EditText txtPassword;
    ImageView imgShowPassword;
    Button btnSignIn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //CODING IN EVERY ACTIVITY
        ActionBar actionBar = getSupportActionBar();

        if(actionBar != null)
            actionBar.hide();

        setContentView(R.layout.activity_login);

        loginLayout = findViewById(R.id.loginLayout);

        mediaPlayer = MediaPlayer.create(this, R.raw.bloop);

        txtEmailUsername = findViewById(R.id.txtEmailUsername);
        txtPassword = findViewById(R.id.txtPassword);
        imgShowPassword = findViewById(R.id.imgShowPassword);
        btnSignIn = findViewById(R.id.btnSignIn);

        SharedPreferences sharedPreferences = getSharedPreferences("LOGGED_USER", Context.MODE_PRIVATE);

        boolean day = sharedPreferences.getBoolean("day", true);

        window = getWindow();

        if(day) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#000000"));

            manageDrawable(true);
        } else
            applyDarkTheme();

        txtEmailUsername.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void afterTextChanged(Editable editable) {
                String text = editable.toString();
                String lowerCaseText = text.toLowerCase();

                //MANAGE INFINITE LOOP
                if(!text.equals(lowerCaseText)) {
                    txtEmailUsername.removeTextChangedListener(this);
                    txtEmailUsername.setText(lowerCaseText);
                    txtEmailUsername.setSelection(lowerCaseText.length());
                    txtEmailUsername.addTextChangedListener(this);
                }
            }
        });

        imgShowPassword.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if(txtPassword.getTransformationMethod().equals(HideReturnsTransformationMethod.getInstance())) {
                    txtPassword.setTransformationMethod(PasswordTransformationMethod.getInstance());

                    Drawable eyeDrawable;

                    if(day) {
                        eyeDrawable = generateEye(true);
                    } else {
                        eyeDrawable = generateEye(false);
                    }

                    imgShowPassword.setImageDrawable(eyeDrawable);
                } else {
                    txtPassword.setTransformationMethod(HideReturnsTransformationMethod.getInstance());

                    Drawable eyeSlashDrawable;

                    if(day) {
                        eyeSlashDrawable = generateEyeSlash(true);
                    } else {
                        eyeSlashDrawable = generateEyeSlash(false);
                    }

                    imgShowPassword.setImageDrawable(eyeSlashDrawable);
                }

                txtPassword.setSelection(txtPassword.getText().length());
            }
        });

        btnSignIn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                clickAudio(sharedPreferences);

                String value = txtEmailUsername.getText().toString().trim();
                String password = txtPassword.getText().toString();

                if(!value.isEmpty() && !password.isEmpty()) {
                    boolean isEmail = Patterns.EMAIL_ADDRESS.matcher(value).matches();

                    JSONObject json = new JSONObject();

                    try {
                        if(isEmail)
                            json.put("email", value);
                        else
                            json.put("username", value);

                        json.put("password", password);
                        json.put("clientType", "ANDROID_2FA_APP");

                        JsonObjectRequest request = new JsonObjectRequest(
                            Request.Method.POST,
                            MainActivity.BASE_URL + "/api/login",
                            json,

                            new Response.Listener<JSONObject>() {
                                @Override
                                public void onResponse(JSONObject response) {
                                    try {
                                        String message = response.getString("message");

                                        if(message.equals("LOGIN_OK")) {
                                            String token = response.getString("token");

                                            JSONObject userJSON = response.getJSONObject("user");

                                            String username = userJSON.getString("username");
                                            String email = userJSON.getString("email");
                                            String _id = userJSON.getString("_id");

                                            SharedPreferences sharedPreferences = getSharedPreferences("LOGGED_USER", Context.MODE_PRIVATE);
                                            SharedPreferences.Editor editor = sharedPreferences.edit();

                                            editor.putString("username", username);
                                            editor.putString("email", email);
                                            editor.putString("_id", _id);
                                            editor.putString("token", token);
                                            SecureDeviceToken.save(LoginActivity.this, response.getString("deviceToken"));

                                            editor.apply();

                                            startActivity(new Intent(LoginActivity.this, RandomAuthCodeActivity.class));
                                            overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left);
                                            finish();
                                        } else if(message.equals("USER_NOT_ACTIVE"))
                                            Toast.makeText(LoginActivity.this, "User not active", Toast.LENGTH_SHORT).show();
                                        else
                                            Toast.makeText(LoginActivity.this, "User not found", Toast.LENGTH_SHORT).show();
                                    } catch(Exception e) {
                                        Toast.makeText(LoginActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                    }
                                }
                            },

                            new Response.ErrorListener(){
                                @Override
                                public void onErrorResponse(VolleyError error) {
                                    Toast.makeText(LoginActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                }
                            }
                        );

                        Volley.newRequestQueue(getApplicationContext()).add(request);
                    } catch(JSONException e) {
                        Toast.makeText(LoginActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                    }
                } else
                    Toast.makeText(LoginActivity.this, "Both fields are required", Toast.LENGTH_SHORT).show();
            }
        });
    }

    public void applyDarkTheme() {
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#333333"));

        loginLayout.setBackgroundColor(Color.parseColor("#000000"));
        btnSignIn.setTextColor(Color.parseColor("#000000"));

        manageDrawable(false);
    }

    public void manageDrawable(boolean day) {
        Drawable editTextDrawable = getResources().getDrawable(R.drawable.edit_text_border_bottom);
        LayerDrawable editTextLayerDrawable = (LayerDrawable) editTextDrawable;
        GradientDrawable editTextGradientDrawable = (GradientDrawable) editTextLayerDrawable.getDrawable(1);

        Drawable eyeDrawable;

        if(day) {
            editTextGradientDrawable.setColor(Color.parseColor("#f3f3f3"));

            txtEmailUsername.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtEmailUsername.setTextColor(Color.parseColor("#808080"));

            txtPassword.setHintTextColor(Color.parseColor("#A9A9A9"));
            txtPassword.setTextColor(Color.parseColor("#808080"));

            eyeDrawable = generateEye(true);
        } else {
            editTextGradientDrawable.setColor(Color.parseColor("#333333"));

            txtEmailUsername.setHintTextColor(Color.parseColor("#707070"));
            txtEmailUsername.setTextColor(Color.parseColor("#A0A0A0"));

            txtPassword.setHintTextColor(Color.parseColor("#707070"));
            txtPassword.setTextColor(Color.parseColor("#A0A0A0"));

            eyeDrawable = generateEye(false);
        }

        txtEmailUsername.setBackground(editTextDrawable);
        txtPassword.setBackground(editTextDrawable);

        imgShowPassword.setImageDrawable(eyeDrawable);
    }

    public Drawable generateEye(boolean day) {
        Drawable eyeDrawable = getResources().getDrawable(R.drawable.eye_solid);
        LayerDrawable eyeLayerDrawable = (LayerDrawable) eyeDrawable;
        GradientDrawable eyeGradientDrawable = (GradientDrawable) eyeLayerDrawable.getDrawable(0);

        if(day) {
            eyeGradientDrawable.setColor(Color.parseColor("#f3f3f3"));
        } else {
            eyeGradientDrawable.setColor(Color.parseColor("#333333"));
        }

        return eyeDrawable;
    }

    public Drawable generateEyeSlash(boolean day) {
        Drawable eyeSlashDrawable = getResources().getDrawable(R.drawable.eye_slash_solid);
        LayerDrawable eyeSlashLayerDrawable = (LayerDrawable) eyeSlashDrawable;
        GradientDrawable eyeSlashGradientDrawable = (GradientDrawable) eyeSlashLayerDrawable.getDrawable(0);

        if(day) {
            eyeSlashGradientDrawable.setColor(Color.parseColor("#f3f3f3"));
        } else {
            eyeSlashGradientDrawable.setColor(Color.parseColor("#333333"));
        }

        return eyeSlashDrawable;
    }

    public void clickAudio(SharedPreferences sharedPreferences) {
        boolean volume = sharedPreferences.getBoolean("volume", true);

        if(volume)
            mediaPlayer.start();
    }
}