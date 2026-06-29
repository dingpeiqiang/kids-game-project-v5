package com.kidsgame.simple;

import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.tencent.msdk.dns.DnsConfig;
import com.tencent.msdk.dns.MSDKDnsResolver;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        DnsConfig.Builder builder = new DnsConfig.Builder()
            .dnsId(BuildConfig.HTTPDNS_ID)
            .token(BuildConfig.HTTPDNS_TOKEN)
            .https();
        if (BuildConfig.DEBUG) {
            builder.logLevel(Log.WARN);
        }
        MSDKDnsResolver.getInstance().init(this, builder.build());
    }
}
