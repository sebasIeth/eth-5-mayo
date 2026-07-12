// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SelloRegistry — Registro on-chain del Sello de Turismo de Salud (SECTUR México)
/// @notice Cuando un establecimiento obtiene su Sello, la plataforma (relayer)
///         graba aquí un registro inmutable y verificable. El gas lo paga la
///         plataforma (patrocinado); el establecimiento no necesita wallet.
contract SelloRegistry {
    address public owner;

    struct Sello {
        string empresa;    // razón social
        string giro;       // Hotel, Clínica, etc.
        string consultor;  // consultor que otorgó el sello
        uint256 fecha;     // timestamp on-chain
        bytes32 datosHash; // hash de la información del expediente (integridad)
        bool existe;
    }

    // id (hash del registro interno) => Sello
    mapping(bytes32 => Sello) public sellos;

    event SelloRegistrado(
        bytes32 indexed id,
        string empresa,
        string giro,
        string consultor,
        uint256 fecha,
        bytes32 datosHash
    );

    event OwnerTransferido(address indexed anterior, address indexed nuevo);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "SelloRegistry: no autorizado");
        _;
    }

    /// @notice Graba (o actualiza) el registro de un Sello.
    function registrar(
        bytes32 id,
        string calldata empresa,
        string calldata giro,
        string calldata consultor,
        bytes32 datosHash
    ) external onlyOwner {
        sellos[id] = Sello(empresa, giro, consultor, block.timestamp, datosHash, true);
        emit SelloRegistrado(id, empresa, giro, consultor, block.timestamp, datosHash);
    }

    /// @notice Verifica públicamente un Sello por su id.
    function verificar(bytes32 id)
        external
        view
        returns (
            bool existe,
            string memory empresa,
            string memory giro,
            string memory consultor,
            uint256 fecha,
            bytes32 datosHash
        )
    {
        Sello memory s = sellos[id];
        return (s.existe, s.empresa, s.giro, s.consultor, s.fecha, s.datosHash);
    }

    function transferirOwner(address nuevo) external onlyOwner {
        require(nuevo != address(0), "SelloRegistry: owner invalido");
        emit OwnerTransferido(owner, nuevo);
        owner = nuevo;
    }
}
