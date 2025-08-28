import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from './prisma/prisma.service'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ValidationPipe } from '@nestjs/common'


async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const prisma = app.get(PrismaService)
  await prisma.enableShutdownHooks(app)
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  // Filtro global de errores
  app.useGlobalFilters(app.get(AllExceptionsFilter))

  await app.listen(3000)
}
bootstrap()
