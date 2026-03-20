/**
 * 数据验证工具
 */
export class Validator {
  /**
   * 验证手机号
   */
  static isPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  /**
   * 验证邮箱
   */
  static isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * 验证年龄（3-12岁）
   */
  static isValidAge(age: number): boolean {
    return age >= 3 && age <= 12;
  }

  /**
   * 验证用户名
   */
  static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_\u4e00-\u9fa5]{2,16}$/.test(username);
  }

  /**
   * 验证密码（6-20位）
   */
  static isValidPassword(password: string): boolean {
    return /^.{6,20}$/.test(password);
  }

  /**
   * 验证是否为数字
   */
  static isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * 验证是否为正整数
   */
  static isPositiveInteger(value: any): boolean {
    return Number.isInteger(value) && value > 0;
  }

  /**
   * 验证是否为空
   */
  static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
}
