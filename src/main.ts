import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    });

    const port = process.env.PORT || 3000;
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strips away fields not in the DTO
            forbidNonWhitelisted: true, // Throws error if extra fields are sent
            transform: true // Automatically transforms payloads to DTO instances
        })
    );
    await app.listen(port);
    console.log(`Application is running on port ${port}`);
}
bootstrap();
