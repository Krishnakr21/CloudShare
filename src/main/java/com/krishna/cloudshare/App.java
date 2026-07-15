package com.krishna.cloudshare;

import com.krishna.cloudshare.controller.FileController;
import java.io.IOException;

/**
 * CloudShare - P2P File Sharing Application
 */
public class App {
    public static void main(String[] args) {
        try {
            String portEnv = System.getenv("PORT");
            int port = portEnv != null ? Integer.parseInt(portEnv) : 8080;
            
            // Start the API server on the configured port
            FileController fileController = new FileController(port);
            fileController.start();
            
            System.out.println("CloudShare server started on port " + port);
            System.out.println("UI available at http://localhost:3000");
            
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("Shutting down server...");
                fileController.stop();
            }));
            
            if (System.console() != null) {
                System.out.println("Press Enter to stop the server");
                System.in.read();
            } else {
                System.out.println("Running in non-interactive mode. Keeping alive...");
                Object lock = new Object();
                synchronized (lock) {
                    try {
                        lock.wait();
                    } catch (InterruptedException e) {
                        System.out.println("Main thread interrupted, exiting...");
                    }
                }
            }
            
        } catch (IOException e) {
            System.err.println("Error starting server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
