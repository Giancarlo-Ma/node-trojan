enum AddressType {
  IPV4 = 1,
  DOMAINNAME = 3,
  IPV6 = 4,
}

export class SOCKS5Address {
  addressType: AddressType;
  address: string;
  port: number;
  parse(data: Buffer): { isValid: boolean; addressLen: number } {
    console.log('parse', data);
    if (
      data.length === 0 ||
      (data[0] !== AddressType.IPV4 &&
        data[0] !== AddressType.IPV6 &&
        data[0] !== AddressType.DOMAINNAME)
    ) {
      return {
        isValid: false,
        addressLen: 0,
      };
    }

    this.addressType = data[0];
    console.log(this.addressType, 'addresstype');
    console.log(data.subarray(2).toString());
    switch (this.addressType) {
      case AddressType.IPV4: {
        if (data.length > 4 + 2) {
          this.address = `${String.fromCharCode(data[1])}.${String.fromCharCode(
            data[2],
          )}.${String.fromCharCode(data[3])}.${String.fromCharCode(data[4])}`;
          this.port = (data[5] << 8) | data[6];
          console.log('ipv4', this.address);
          console.log('port', this.port);
          return {
            isValid: true,
            addressLen: 1 + 4 + 2,
          };
        }
        break;
      }
      case AddressType.DOMAINNAME: {
        const domainLen = data[1];
        if (!domainLen) break;
        if (data.length > 1 + domainLen + 2) {
          this.address = data.subarray(2, 2 + domainLen).toString();
          console.log(this.address);
          this.port = (data[domainLen + 2] << 8) | data[domainLen + 3];
          console.log(this.port);
          return {
            addressLen: 1 + 1 + domainLen + 2,
            isValid: true,
          };
        }
        break;
      }
      case AddressType.IPV6: {
        if (data.length > 16 + 2) {
          this.address = Buffer.concat([
            Buffer.from(
              '%02x%02x:%02x%02x:%02x%02x:%02x%02x:%02x%02x:%02x%02x:%02x%02x:%02x%02x',
            ),
            data.subarray(1, 17),
          ]).toString();
          this.port = (data[17] << 8) | data[18];
          return {
            isValid: true,
            addressLen: 1 + 16 + 2,
          };
        }
        break;
      }
    }
    return {
      isValid: false,
      addressLen: 0,
    };
  }
}
