export class AuthError extends Error {
  constructor(message = "No autenticado") {
    super(message)
    this.name = "AuthError"
  }
}

export class NotFoundError extends Error {
  constructor(message = "No encontrado") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No autorizado") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}
