package com.lanetang.simpleiotdemo;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class DashboardActivity extends AppCompatActivity {
    private static final String TAG = "MainFragment";

    private static final int REQUEST_LOGIN = 0;

    private static final int TYPING_TIMER_LENGTH = 600;

    private TextView tv_device_temp, tv_device_memory, tv_device_cpu, tv_device_sine;
    private Button btn_turn_on, btn_turn_off;
    private TextView tv_motion_value, tv_temp_value, tv_humi_value;
    private Button btn_logout;
    private Socket mSocket;

    private Boolean isConnected = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        tv_device_temp = (TextView) findViewById(R.id.tv_dev_temp_value);
        tv_device_memory = (TextView) findViewById(R.id.tv_dev_memory_value);
        tv_device_cpu = (TextView) findViewById(R.id.tv_dev_cpu_load);
        tv_device_sine = (TextView) findViewById(R.id.tv_dev_sine);

        btn_turn_on = (Button) findViewById(R.id.btn_turn_on);
        btn_turn_on.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mSocket.emit("light", "on");
                Toast.makeText(getApplicationContext(), "light on", Toast.LENGTH_SHORT).show();
            }
        });

        btn_turn_off = (Button) findViewById(R.id.btn_turn_off);
        btn_turn_off.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mSocket.emit("light", "off");
                Toast.makeText(getApplicationContext(), "light off", Toast.LENGTH_SHORT).show();
            }
        });

        tv_motion_value = (TextView) findViewById(R.id.tv_motion_sensor_value);
        tv_temp_value = (TextView) findViewById(R.id.tv_temp_sensor_value);
        tv_humi_value = (TextView) findViewById(R.id.tv_humi_sensor_value);

        btn_logout = (Button) findViewById(R.id.btn_logout);
        btn_logout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(getApplicationContext(), MainActivity.class));
                finish();
            }
        });

        SocketApplication app = (SocketApplication) getApplication();
        mSocket = app.getSocket();
        mSocket.on(Socket.EVENT_CONNECT, onConnect);
        mSocket.on(Socket.EVENT_DISCONNECT, onDisconnect);
        mSocket.on(Socket.EVENT_CONNECT_ERROR, onConnectError);
        mSocket.on(Socket.EVENT_CONNECT_TIMEOUT, onConnectError);
        mSocket.on("device-status", onDeviceStatus);
        mSocket.on("motion-sensor", onMotionDetect);
        mSocket.on("temperature-sensor", onTemperatureData);
        mSocket.connect();

        // startActivity(new Intent(getApplicationContext(), MainActivity.class));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mSocket.disconnect();

        mSocket.off(Socket.EVENT_CONNECT, onConnect);
        mSocket.off(Socket.EVENT_DISCONNECT, onDisconnect);
        mSocket.off(Socket.EVENT_CONNECT_ERROR, onConnectError);
        mSocket.off(Socket.EVENT_CONNECT_TIMEOUT, onConnectError);
        mSocket.off("device-status", onDeviceStatus);
        mSocket.off("motion-sensor", onMotionDetect);
        mSocket.off("temperature-sensor", onTemperatureData);
    }

    private Emitter.Listener onConnect = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (!isConnected) {
                        Toast.makeText(getApplicationContext(),
                                R.string.connect, Toast.LENGTH_LONG).show();
                        isConnected = true;
                    }
                }
            });
        }
    };

    private Emitter.Listener onDisconnect = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Log.i(TAG, "diconnected");
                    isConnected = false;
                    Toast.makeText(getApplicationContext(),
                            R.string.disconnect, Toast.LENGTH_LONG).show();
                }
            });
        }
    };

    private Emitter.Listener onConnectError = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Log.e(TAG, "Error connecting");
                    Toast.makeText(getApplicationContext(),
                            R.string.error_connect, Toast.LENGTH_LONG).show();
                }
            });
        }
    };

    private Emitter.Listener onDeviceStatus = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    JSONObject data = (JSONObject) args[0];
                    String deviceTemperature;
                    String memoryUsage;
                    String cpuLoad;
                    String sine;
                    try {
                        deviceTemperature = data.getString("cputemp");
                        memoryUsage = data.getString("memoryusage");
                        cpuLoad = data.getString("cpuload");
                        sine = data.getString("sine");
                    } catch (JSONException e) {
                        Log.e(TAG, e.getMessage());
                        return;
                    }
                    deviceStatus(deviceTemperature, memoryUsage, cpuLoad, sine);

                }
            });
        }
    };

    private Emitter.Listener onMotionDetect = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    JSONObject data = (JSONObject) args[0];
                    int motionData;
                    try {
                        motionData = data.getInt("motionDetected");
                    } catch (JSONException e) {
                        Log.e(TAG, e.getMessage());
                        return;
                    }
                    motionDetected(motionData);
                }
            });
        }
    };

    private Emitter.Listener onTemperatureData = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    JSONObject data = (JSONObject) args[0];
                    String temperature;
                    String humidity;
                    try {
                        temperature = data.getString("temperature");
                        humidity = data.getString("humidity");
                    } catch (JSONException e) {
                        Log.e(TAG, e.getMessage());
                        return;
                    }
                    temperatureData(temperature, humidity);
                }
            });
        }
    };

    private void deviceStatus(final String temperature, final String memory,
                                final String cpu, final String sine) {
        tv_device_temp.post(new Runnable() {
            @Override
            public void run() {
                tv_device_temp.setText(temperature);
            }
        });

        tv_device_memory.post(new Runnable() {
            @Override
            public void run() {
                tv_device_memory.setText(memory);
            }
        });

        tv_device_cpu.post(new Runnable() {
            @Override
            public void run() {
                tv_device_cpu.setText(cpu);
            }
        });

        tv_device_sine.post(new Runnable() {
            @Override
            public void run() {
                tv_device_sine.setText(sine);
            }
        });
    }

    private void motionDetected(int motion) {
        final String text;

        if (motion == 1) {
            text = "Motion Detected";
        } else if (motion == 0) {
            text = "No Motion";
        } else {
            text = "No Data";
        }

        tv_motion_value.post(new Runnable() {
            @Override
            public void run() {
                tv_motion_value.setText(text);
            }
        });
    }

    private void temperatureData(final String temp, final String humi) {
        tv_temp_value.post(new Runnable() {
            @Override
            public void run() {
                tv_temp_value.setText(temp);
            }
        });

        tv_humi_value.post(new Runnable() {
            @Override
            public void run() {
                tv_humi_value.setText(humi);
            }
        });
    }
}
