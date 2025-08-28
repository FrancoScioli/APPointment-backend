"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    await prisma.enableShutdownHooks(app);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    // Filtro global de errores
    app.useGlobalFilters(app.get(all_exceptions_filter_1.AllExceptionsFilter));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map