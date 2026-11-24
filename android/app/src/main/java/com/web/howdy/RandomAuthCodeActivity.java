package com.web.howdy;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Handler;
import android.support.constraint.ConstraintLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.EditText;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.Response;
import com.android.volley.RetryPolicy;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.security.SecureRandom;

import android.os.Vibrator;

public class RandomAuthCodeActivity extends AppCompatActivity {
    ConstraintLayout randomAuthCodeLayout;
    Window window;
    Vibrator vibrator;

    ConstraintLayout txtNumberLayout;
    ConstraintLayout txtNumberLayoutContainer;
    EditText txtNumber1;
    EditText txtNumber2;
    EditText txtNumber3;
    EditText txtNumber4;
    EditText txtNumber5;
    EditText txtNumber6;

    int attempt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //CODING IN EVERY ACTIVITY
        ActionBar actionBar = getSupportActionBar();

        if(actionBar != null)
            actionBar.hide();

        setContentView(R.layout.activity_random_auth_code);

        randomAuthCodeLayout = findViewById(R.id.randomAuthCodeLayout);

        txtNumberLayout = findViewById(R.id.txtNumberLayout);
        txtNumberLayoutContainer = findViewById(R.id.txtNumberLayoutContainer);
        txtNumber1 = findViewById(R.id.txtNumber1);
        txtNumber2 = findViewById(R.id.txtNumber2);
        txtNumber3 = findViewById(R.id.txtNumber3);
        txtNumber4 = findViewById(R.id.txtNumber4);
        txtNumber5 = findViewById(R.id.txtNumber5);
        txtNumber6 = findViewById(R.id.txtNumber6);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        attempt = 3;

        SharedPreferences sharedPreferences = getSharedPreferences("LOGGED_USER", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();

        boolean day = sharedPreferences.getBoolean("day", true);

        window = getWindow();

        if(day) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#000000"));

            manageDrawable(true);
        } else
            applyDarkTheme();

        boolean volume = sharedPreferences.getBoolean("volume", true);

        // The server generates the enrollment code and delivers it via email.

        String token = sharedPreferences.getString("token", "");

        String username = sharedPreferences.getString("username", "");
        String email = sharedPreferences.getString("email", "");

        txtNumber1.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void afterTextChanged(Editable editable) {
                if(editable.length() == 1) {
                    txtNumber2.requestFocus();
                }
            }
        });

        txtNumber2.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void afterTextChanged(Editable editable) {
                if(editable.length() == 1) {
                    txtNumber3.requestFocus();
                }
            }
        });

        txtNumber2.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View view, int i, KeyEvent keyEvent) {
                if(keyEvent.getAction() == KeyEvent.ACTION_DOWN) {
                    if(i == KeyEvent.KEYCODE_DEL && txtNumber2.getText().length() == 0) {
                        txtNumber1.requestFocus();
                        return true;
                    }
                }

                return false;
            }
        });

        txtNumber3.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void afterTextChanged(Editable editable) {
                if(editable.length() == 1){
                    txtNumber4.requestFocus();
                }
            }
        });

        txtNumber3.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View view, int i, KeyEvent keyEvent) {
                if(keyEvent.getAction() == KeyEvent.ACTION_DOWN) {
                    if(i == KeyEvent.KEYCODE_DEL && txtNumber3.getText().length() == 0) {
                        txtNumber2.requestFocus();
                        return true;
                    }
                }

                return false;
            }
        });

        txtNumber4.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable e) { if (e.length() == 1) txtNumber5.requestFocus(); }
        });
        txtNumber5.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable e) { if (e.length() == 1) txtNumber6.requestFocus(); }
        });
        txtNumber6.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {}

            @Override
            public void afterTextChanged(Editable editable) {
                if(editable.length() == 1) {
                    String randomAuthCodeInput = txtNumber1.getText().toString() + txtNumber2.getText().toString() + txtNumber3.getText().toString() + txtNumber4.getText().toString() + txtNumber5.getText().toString() + txtNumber6.getText().toString();

                    if (randomAuthCodeInput.length() == 6) {
                        JSONObject enrollment = new JSONObject();
                        try { enrollment.put("enrollmentCode", randomAuthCodeInput); }
                        catch (JSONException e) { return; }
                        JsonObjectRequest request = new JsonObjectRequest(
                            Request.Method.PUT,
                            MainActivity.BASE_URL + "/tokenApi/android/enableAuth2FA",
                            enrollment,

                            new Response.Listener<JSONObject>() {
                                @Override
                                public void onResponse(JSONObject response) {
                                    try {
                                        String message = response.getString("message");

                                        if(message.equals("ENABLE_AUTH_2FA_OK")) {
                                            editor.putBoolean("auth_2FA", true);
                                            editor.apply();

                                            startActivity(new Intent(RandomAuthCodeActivity.this, AuthActivity.class));
                                            overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left);
                                            finish();
                                        } else {
                                            Toast.makeText(RandomAuthCodeActivity.this, "Invalid or expired code", Toast.LENGTH_SHORT).show();
                                            txtNumber1.setText(""); txtNumber2.setText("");
                                            txtNumber3.setText(""); txtNumber4.setText("");
                                            txtNumber5.setText(""); txtNumber6.setText("");
                                            txtNumber1.requestFocus();
                                        }
                                    } catch(JSONException e) {
                                        Toast.makeText(RandomAuthCodeActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                        errorHandler(editor, day, volume);
                                    }
                                }
                            },

                            new Response.ErrorListener() {
                                @Override
                                public void onErrorResponse(VolleyError error) {
                                    Toast.makeText(RandomAuthCodeActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                    errorHandler(editor, day, volume);
                                }
                            }
                        ) {
                            @Override
                            public Map<String, String> getHeaders() {
                                Map<String, String> headers = new HashMap<>();
                                headers.put("token", token);
                                return headers;
                            }
                        };

                        Volley.newRequestQueue(getApplicationContext()).add(request);
                    } else {
                        if(vibrator.hasVibrator())
                            vibrator.vibrate(1000);

                        attempt--;

                        if(attempt > 0) {
                            new Handler().postDelayed(new Runnable() {
                                @Override
                                public void run() {
                                    txtNumber1.setText("");
                                    txtNumber2.setText("");
                                    txtNumber3.setText("");
                                    txtNumber4.setText("");
                                    txtNumber5.setText("");
                                    txtNumber6.setText("");

                                    txtNumber1.requestFocus();
                                }
                            }, 1000);

                            if(attempt > 1)
                                Toast.makeText(RandomAuthCodeActivity.this, "Wrong auth code (" + attempt + " attempts remaining)", Toast.LENGTH_SHORT).show();
                            else
                                Toast.makeText(RandomAuthCodeActivity.this, "Wrong auth code (" + attempt + " attempt remaining)", Toast.LENGTH_SHORT).show();

                            Animation shake = AnimationUtils.loadAnimation(RandomAuthCodeActivity.this, R.anim.shake);
                            txtNumberLayoutContainer.setPadding(0, 100, 0, 100);
                            txtNumberLayout.startAnimation(shake);
                        } else {
                            Toast.makeText(RandomAuthCodeActivity.this, "Auth failed", Toast.LENGTH_SHORT).show();
                            errorHandler(editor, day, volume);
                        }
                    }
                }
            }
        });

        txtNumber5.setOnKeyListener(new View.OnKeyListener() {
            @Override public boolean onKey(View view, int i, KeyEvent event) {
                if (event.getAction() == KeyEvent.ACTION_DOWN && i == KeyEvent.KEYCODE_DEL && txtNumber5.length() == 0) {
                    txtNumber4.requestFocus(); return true;
                }
                return false;
            }
        });
        txtNumber6.setOnKeyListener(new View.OnKeyListener() {
            @Override public boolean onKey(View view, int i, KeyEvent event) {
                if (event.getAction() == KeyEvent.ACTION_DOWN && i == KeyEvent.KEYCODE_DEL && txtNumber6.length() == 0) {
                    txtNumber5.requestFocus(); return true;
                }
                return false;
            }
        });
        txtNumber4.setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View view, int i, KeyEvent keyEvent) {
                if(keyEvent.getAction() == KeyEvent.ACTION_DOWN) {
                    if(i == KeyEvent.KEYCODE_DEL && txtNumber4.getText().length() == 0) {
                        txtNumber3.requestFocus();
                        return true;
                    }
                }

                return false;
            }
        });

        JSONObject json = new JSONObject();

        try {
            // The server derives email and username from the validated session.

            JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.POST,
                MainActivity.BASE_URL + "/tokenApi/android/sendAndroidRandomAuthCode",
                json,

                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        try {
                            String message = response.getString("message");

                            if(!message.equals("EMAIL_SEND_OK")) {
                                Toast.makeText(RandomAuthCodeActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                                errorHandler(editor, day, volume);
                            } else {
                                Toast.makeText(RandomAuthCodeActivity.this, "Check your e-mail", Toast.LENGTH_SHORT).show();
                            }
                        } catch(JSONException e) {
                            Toast.makeText(RandomAuthCodeActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                            errorHandler(editor, day, volume);
                        }
                    }
                },

                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(RandomAuthCodeActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
                        errorHandler(editor, day, volume);
                    }
                }
            ) {
                @Override
                public Map<String, String> getHeaders() {
                    Map<String, String> headers = new HashMap<>();
                    headers.put("token", token);
                    return headers;
                }
            };


            Volley.newRequestQueue(getApplicationContext()).add(request);
        } catch(JSONException e) {
            Toast.makeText(RandomAuthCodeActivity.this, "An error occurred", Toast.LENGTH_SHORT).show();
            errorHandler(editor, day, volume);
        }
    }

    public void applyDarkTheme() {
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#333333"));

        randomAuthCodeLayout.setBackgroundColor(Color.parseColor("#000000"));

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

            txtNumber1.setTextColor(Color.parseColor("#808080"));
            txtNumber2.setTextColor(Color.parseColor("#808080"));
            txtNumber3.setTextColor(Color.parseColor("#808080"));
            txtNumber4.setTextColor(Color.parseColor("#808080"));
        } else {
            editTextGradientDrawable.setColor(Color.parseColor("#333333"));

            txtNumber1.setHintTextColor(Color.parseColor("#707070"));
            txtNumber2.setHintTextColor(Color.parseColor("#707070"));
            txtNumber3.setHintTextColor(Color.parseColor("#707070"));
            txtNumber4.setHintTextColor(Color.parseColor("#707070"));

            txtNumber1.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber2.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber3.setTextColor(Color.parseColor("#A0A0A0"));
            txtNumber4.setTextColor(Color.parseColor("#A0A0A0"));
        }

        txtNumber1.setBackground(editTextDrawable);
        txtNumber2.setBackground(editTextDrawable);
        txtNumber3.setBackground(editTextDrawable);
        txtNumber4.setBackground(editTextDrawable);
    }

    public String randomAuthCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(9000) + 1000; //RANDOM NUMBER BETWEEN 1000 AND 9999
        return String.valueOf(code);
    }

    public void errorHandler(SharedPreferences.Editor editor, boolean day, boolean volume) {
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                editor.clear();
                editor.putBoolean("day", day);
                editor.putBoolean("volume", volume);
                editor.apply();

                startActivity(new Intent(RandomAuthCodeActivity.this, LoginActivity.class));
                overridePendingTransition(R.anim.slide_in_left, R.anim.slide_out_right);
                finish();
            }
        }, 2000);
    }
}