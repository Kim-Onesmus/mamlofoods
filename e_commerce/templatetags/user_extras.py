from django import template

register = template.Library()

@register.filter
def email_name(value):
    """Return the part of the email before the @."""
    if value and '@' in value:
        return value.split('@')[0]
    return value 


@register.filter
def times(number):
    return range(int(number))

@register.filter
def subtract(value, arg):
    return int(value) - int(arg)