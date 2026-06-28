package com.kidsgame.simple;

import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.dnspod.httpdns.DnsConfig;
import com.dnspod.httpdns.MSDKDnsResolver;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        DnsConfig.Builder builder = new DnsConfig.Builder()
            .dnsId(BuildConfig.HTTPDNS_ID)
            .token(BuildConfig.HTTPDNS_TOKEN)
            .https();
        if (BuildConfig.DEBUG) {
            builder.logLevel(Log.VERBOSE);
        }
        MSDKDnsResolver.getInstance().init(this, builder.build());
    }
}
